import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { inventory_item_id, quantity, price, wholesale_price } = body;

  if (!inventory_item_id) {
    return NextResponse.json({ error: "inventory_item_id is required" }, { status: 400 });
  }

  // Verify shop ownership
  const { data: item } = await supabase
    .from("inventory_items")
    .select("id, shop_id, shops!inner(business_id, businesses!inner(owner_id))")
    .eq("id", inventory_item_id)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const itemAny = item as unknown as { shops: { businesses: { owner_id: string }[] } };
  if (itemAny.shops?.businesses?.[0]?.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = { last_updated: new Date().toISOString() };
  if (quantity !== undefined) updateData.quantity = quantity;
  if (price !== undefined) updateData.price = price;
  if (wholesale_price !== undefined) updateData.wholesale_price = wholesale_price;

  const { data, error } = await supabase
    .from("inventory_items")
    .update(updateData)
    .eq("id", inventory_item_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
