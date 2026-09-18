import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const city = searchParams.get("city");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Search products
  const productQuery = supabase
    .from("products")
    .select("id, name, normalized_name, brand, model, category_id")
    .or(`name.ilike.%${query}%,normalized_name.ilike.%${query}%,brand.ilike.%${query}%`)
    .eq("is_active", true)
    .limit(50);

  const { data: products } = await productQuery;

  if (!products || products.length === 0) {
    return NextResponse.json({ results: [], count: 0 });
  }

  const productIds = products.map((p) => p.id);

  // Get inventory
  let inventoryQuery = supabase
    .from("v_stock_availability")
    .select("*")
    .in("product_id", productIds)
    .gt("available_quantity", 0);

  if (city) {
    inventoryQuery = inventoryQuery.ilike("city", `%${city}%`);
  }

  const { data: inventory } = await inventoryQuery.limit(limit);

  // Record search demand signal
  await supabase.from("demand_signals").insert({
    query_text: query,
    signal_type: "search",
    city: city || "unknown",
  });

  return NextResponse.json({
    results: inventory || [],
    count: (inventory || []).length,
    products: products,
  });
}
