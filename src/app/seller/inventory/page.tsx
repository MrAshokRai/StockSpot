"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockBadge } from "@/components/shared/stock-badge";
import { formatCurrency, getTimeAgo } from "@/lib/helpers";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Save,
  X,
  Upload,
  AlertTriangle,
} from "lucide-react";

interface InventoryRow {
  id: string;
  product_id: string;
  product_name: string;
  brand: string | null;
  quantity: number;
  reserved_quantity: number;
  price: number;
  wholesale_price: number | null;
  min_order_quantity: number;
  last_updated: string;
  is_available: boolean;
}

export default function SellerInventoryPage() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [editPrice, setEditPrice] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: 0, quantity: 0 });
  const supabase = createClient();

  useEffect(() => {
    const fetchInventory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).single();
      if (!biz) { setLoading(false); return; }

      const { data: shop } = await supabase.from("shops").select("id").eq("business_id", biz.id).single();
      if (!shop) { setLoading(false); return; }

      setShopId(shop.id);

      const { data } = await supabase
        .from("inventory_items")
        .select("id, product_id, quantity, reserved_quantity, price, wholesale_price, min_order_quantity, last_updated, is_available, product(name, brand)")
        .eq("shop_id", shop.id)
        .order("last_updated", { ascending: false });

      setInventory((data || []).map((i: Record<string, unknown>) => {
        const prod = Array.isArray(i.product) ? i.product[0] : i.product;
        return {
          id: i.id as string,
          product_id: i.product_id as string,
          product_name: (prod as { name?: string })?.name || "Unknown",
          brand: (prod as { brand?: string })?.brand || null,
          quantity: i.quantity as number,
          reserved_quantity: i.reserved_quantity as number,
          price: i.price as number,
          wholesale_price: i.wholesale_price as number | null,
          min_order_quantity: i.min_order_quantity as number,
          last_updated: i.last_updated as string,
          is_available: i.is_available as boolean,
        };
      }));
      setLoading(false);
    };
    fetchInventory();
  }, []);

  const handleQuickUpdate = async (itemId: string) => {
    await supabase
      .from("inventory_items")
      .update({ quantity: editQty, price: editPrice, last_updated: new Date().toISOString() })
      .eq("id", itemId);

    setInventory((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, quantity: editQty, price: editPrice, last_updated: new Date().toISOString() } : i
      )
    );
    setEditingId(null);
  };

  const handleAddProduct = async () => {
    if (!shopId || !newProduct.name) return;

    const normalizedName = newProduct.name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

    const { data: product, error: prodError } = await supabase
      .from("products")
      .upsert({
        name: newProduct.name,
        slug: newProduct.name.toLowerCase().replace(/\s+/g, "-"),
        normalized_name: normalizedName,
        search_keywords: [normalizedName],
        unit: "piece",
      }, { onConflict: "slug" })
      .select()
      .single();

    if (prodError || !product) return;

    await supabase.from("inventory_items").upsert({
      product_id: product.id,
      shop_id: shopId,
      quantity: newProduct.quantity,
      price: newProduct.price,
      last_updated: new Date().toISOString(),
    }, { onConflict: "product_id,shop_id" });

    setInventory((prev) => [{
      id: "new",
      product_id: product.id,
      product_name: newProduct.name,
      brand: null,
      quantity: newProduct.quantity,
      reserved_quantity: 0,
      price: newProduct.price,
      wholesale_price: null,
      min_order_quantity: 1,
      last_updated: new Date().toISOString(),
      is_available: true,
    }, ...prev]);

    setNewProduct({ name: "", price: 0, quantity: 0 });
    setShowAddProduct(false);
  };

  const filtered = inventory.filter(
    (i) => i.product_name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-600">{inventory.length} products in your inventory</p>
        </div>
        <Button onClick={() => setShowAddProduct(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {showAddProduct && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Add New Product</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddProduct(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Product name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="e.g. Bosch GSB 500 Drill"
              />
              <Input
                label="Price (Rs.)"
                type="number"
                value={newProduct.price || ""}
                onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Quantity"
                type="number"
                value={newProduct.quantity || ""}
                onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 0 })}
              />
              <div className="flex items-end">
                <Button onClick={handleAddProduct} className="w-full">
                  Add to Inventory
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter products..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Product</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Stock</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Price</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Last Updated</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      {inventory.length === 0
                        ? "No products in inventory. Add your first product!"
                        : "No products match your filter."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                        {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === item.id ? (
                          <input
                            type="number"
                            value={editQty}
                            onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        ) : (
                          <StockBadge
                            quantity={item.quantity}
                            reservedQuantity={item.reserved_quantity}
                            lastUpdated={item.last_updated}
                            compact
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === item.id ? (
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.price)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {getTimeAgo(item.last_updated)}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === item.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleQuickUpdate(item.id)}>
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditQty(item.quantity);
                              setEditPrice(item.price);
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {inventory.filter((i) => i.quantity <= 5 && i.quantity > 0).length > 0 && (
        <div className="mt-4">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <p className="text-sm text-yellow-800">
                <strong>{inventory.filter((i) => i.quantity <= 5 && i.quantity > 0).length} products</strong> have low stock (5 or fewer units).
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
