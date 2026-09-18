"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Search, Trash2 } from "lucide-react";

interface ProductData {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  model: string | null;
  category_id: string | null;
  unit: string;
  sku: string | null;
  created_at: string;
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newProd, setNewProd] = useState({ name: "", brand: "", model: "", sku: "" });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      setProducts((prods as ProductData[]) || []);

      const { data: cats } = await supabase
        .from("product_categories")
        .select("id, name")
        .order("sort_order");
      setCategories((cats || []) as { id: string; name: string }[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAddProduct = async () => {
    if (!newProd.name) return;
    const normalizedName = newProd.name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    const { data, error } = await supabase
      .from("products")
      .upsert({
        name: newProd.name,
        slug: newProd.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        normalized_name: normalizedName,
        search_keywords: [normalizedName, ...(newProd.brand ? [newProd.brand.toLowerCase()] : [])],
        brand: newProd.brand || null,
        model: newProd.model || null,
        sku: newProd.sku || null,
        category_id: selectedCategory || null,
        unit: "piece",
      }, { onConflict: "slug" })
      .select()
      .single();

    if (!error && data) {
      setProducts((prev) => [data as ProductData, ...prev]);
      setNewProd({ name: "", brand: "", model: "", sku: "" });
      setShowAdd(false);
    }
  };

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchFilter.toLowerCase()))
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-600">{products.length} products in catalog</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {showAdd && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Add New Product</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Product name" value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} placeholder="e.g. Bosch GSB 500" required />
              <Input label="Brand" value={newProd.brand} onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })} placeholder="e.g. Bosch" />
              <Input label="Model" value={newProd.model} onChange={(e) => setNewProd({ ...newProd, model: e.target.value })} placeholder="e.g. GSB 500" />
              <Input label="SKU" value={newProd.sku} onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })} placeholder="SKU code" />
              <Select label="Category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} options={[{ value: "", label: "Select category" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddProduct}>Add Product</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((product) => (
          <Card key={product.id}>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {product.brand && <Badge variant="outline" size="sm">{product.brand}</Badge>}
                    {product.model && <Badge variant="outline" size="sm">{product.model}</Badge>}
                  </div>
                  {product.sku && <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
