import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get platform stats
  const [users, sellers, shops, products, orders, demand, pending] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "seller"),
    supabase.from("shops").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("demand_signals").select("*", { count: "exact", head: true }),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
  ]);

  return NextResponse.json({
    stats: {
      totalUsers: users.count || 0,
      totalSellers: sellers.count || 0,
      totalShops: shops.count || 0,
      totalProducts: products.count || 0,
      totalOrders: orders.count || 0,
      totalDemandSignals: demand.count || 0,
      pendingVerifications: pending.count || 0,
    },
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { action, entity_type, entity_id, data: actionData } = body;

  // Log admin action (canonical column: actor_id)
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action,
    entity_type,
    entity_id: entity_id || null,
    details: actionData ? { data: actionData } : {},
  });

  if (entity_type === "business" && action === "verify") {
    // Atomic RPC: updates merchants + profile seller_status (server-side, admin-only)
    const { error: rpcError } = await supabase.rpc("approve_seller_application", { p_business_id: entity_id });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    // Create notification for the verified merchant's owner
    const { data: biz } = await supabase
      .from("merchants")
      .select("user_id, business_name")
      .eq("id", entity_id)
      .single();

    if (biz?.user_id) {
      await supabase.from("notifications").insert({
        user_id: biz.user_id,
        title: "Business Verified",
        message: `Your business "${biz.business_name}" has been verified!`,
        type: "success",
      });
    }
  }

  return NextResponse.json({ success: true });
}
