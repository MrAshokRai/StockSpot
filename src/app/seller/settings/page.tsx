"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, ShieldCheck } from "lucide-react";

export default function SellerSettingsPage() {
  const [shop, setShop] = useState<{ id: string; name: string; address: string; city: string; phone: string; allows_pickup: boolean; allows_delivery: boolean } | null>(null);
  const [business, setBusiness] = useState<{ name: string; description: string; phone: string; email: string; verification_status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: biz } = await supabase.from("merchants").select("id, business_name, description, verification_status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!biz) { setLoading(false); return; }
      setBusiness(biz ? {
        name: biz.business_name,
        description: biz.description || "",
        phone: "",
        email: "",
        verification_status: biz.verification_status,
      } : null);

      const { data: s } = await supabase.from("shops").select("*").eq("business_id", biz.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      setShop(s);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!shop) return;
    setSaving(true);
    await supabase.from("shops").update({
      name: shop.name, address: shop.address, city: shop.city,
      phone: shop.phone, allows_pickup: shop.allows_pickup, allows_delivery: shop.allows_delivery,
    }).eq("id", shop.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shop Settings</h1>

      {business && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Business Profile</h2>
              <Badge variant={business.verification_status === "verified" ? "success" : "warning"} size="sm">
                <ShieldCheck className="w-3 h-3 mr-1" />
                {business.verification_status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Business Name</p>
              <p className="font-medium text-gray-900">{business.name}</p>
            </div>
            {business.description && (
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-900">{business.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {shop && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Shop Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Shop name" value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} />
            <Input label="Address" value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} />
            <Input label="City" value={shop.city} onChange={(e) => setShop({ ...shop, city: e.target.value })} />
            <Input label="Phone" value={shop.phone} onChange={(e) => setShop({ ...shop, phone: e.target.value })} />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={shop.allows_pickup} onChange={(e) => setShop({ ...shop, allows_pickup: e.target.checked })} className="rounded" />
                Allow pickup
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={shop.allows_delivery} onChange={(e) => setShop({ ...shop, allows_delivery: e.target.checked })} className="rounded" />
                Allow delivery
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
