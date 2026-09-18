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

  if (profile?.role !== "seller" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get demand summary
  const { data: demandSummary } = await supabase
    .from("v_demand_summary")
    .select("*")
    .order("search_count", { ascending: false });

  // Get product requests
  const { data: requests } = await supabase
    .from("product_requests")
    .select("*")
    .eq("status", "open")
    .order("request_count", { ascending: false });

  return NextResponse.json({
    demand_summary: demandSummary || [],
    product_requests: requests || [],
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { query_text, signal_type, city, latitude, longitude, product_id } = body;

  if (!query_text || !signal_type) {
    return NextResponse.json({ error: "query_text and signal_type are required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("demand_signals").insert({
    product_id: product_id || null,
    query_text,
    signal_type,
    city: city || "unknown",
    latitude: latitude || null,
    longitude: longitude || null,
    user_id: user.id,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
