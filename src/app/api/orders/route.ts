import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { branch_id, items, fulfillment_type, notes, delivery_address } = body;

  if (!branch_id || !items || items.length === 0) {
    return NextResponse.json({ error: "branch_id and items are required" }, { status: 400 });
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const { data: invItem } = await supabase
      .from("inventory_items")
      .select("id, price, quantity, reserved_quantity, product_id")
      .eq("id", item.inventory_item_id)
      .single();

    if (!invItem) {
      return NextResponse.json({ error: `Inventory item ${item.inventory_item_id} not found` }, { status: 400 });
    }

    const available = (invItem as { quantity: number; reserved_quantity: number }).quantity - (invItem as { quantity: number; reserved_quantity: number }).reserved_quantity;
    if (available < item.quantity) {
      return NextResponse.json({ error: `Insufficient stock for item ${item.inventory_item_id}` }, { status: 400 });
    }

    const unitPrice = (invItem as { price: number }).price;
    const itemTotal = unitPrice * item.quantity;
    totalAmount += itemTotal;

    orderItems.push({
      product_id: (invItem as { product_id: string }).product_id,
      inventory_item_id: (invItem as { id: string }).id,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: itemTotal,
    });
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      branch_id,
      fulfillment_type: fulfillment_type || "pickup",
      total_amount: totalAmount,
      notes: notes || null,
      delivery_address: delivery_address || null,
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // Create order items
  for (const oi of orderItems) {
    await supabase.from("order_items").insert({ ...oi, order_id: order.id });
    // Update reserved quantity
    await supabase.rpc("increment_reserved", { p_id: oi.inventory_item_id, p_qty: oi.quantity }).single();
  }

  return NextResponse.json({ order, items: orderItems });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, seller_status")
    .eq("id", user.id)
    .single();

  if (profile?.seller_status === "seller_verified") {
    // Get branch IDs for this seller (via canonical merchants -> merchant_branches)
    const { data: biz } = await supabase.from("merchants").select("id").eq("user_id", user.id);
    const bizIds = (biz || []).map((b: { id: string }) => b.id);
    const { data: shops } = await supabase.from("merchant_branches").select("id").in("merchant_id", bizIds);
    const branchIds = (shops || []).map((s: { id: string }) => s.id);

    const { data: orders } = await supabase
      .from("orders")
      .select("*, customer:profiles(full_name), items:order_items(*, product:products(name))")
      .in("branch_id", branchIds)
      .order("created_at", { ascending: false });

    return NextResponse.json({ orders });
  }

  // Customer
  const { data: orders } = await supabase
    .from("orders")
    .select("*, branch:merchant_branches(name, merchant:merchants(business_name)), items:order_items(*, product:products(name))")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders });
}
