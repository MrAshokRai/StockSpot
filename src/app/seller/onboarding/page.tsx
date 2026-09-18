"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Store, CheckCircle } from "lucide-react";

const CITIES = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan", "Biratnagar", "Birgunj", "Butwal", "Dharan", "Hetauda"];

const BUSINESS_CATEGORIES = [
  "Hardware & Construction", "Electronics & Technology", "Agriculture & Farming",
  "Automotive Parts", "Clothing & Textiles", "Food & Beverages",
  "Health & Beauty", "Home & Kitchen", "Office & Stationery",
  "Sports & Outdoors", "Industrial Supplies", "Raw Materials", "Other",
];

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  const [business, setBusiness] = useState({
    name: "", description: "", category: "Hardware & Construction", phone: "", email: "",
  });

  const [shop, setShop] = useState({
    name: "", description: "", address: "", city: "Kathmandu", district: "",
    latitude: 27.7172, longitude: 85.324, phone: "",
    allows_pickup: true, allows_delivery: false,
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const handleGetLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setShop({ ...shop, latitude: pos.coords.latitude, longitude: pos.coords.longitude }); },
      () => {}
    );
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");

    const { data: biz, error: bizError } = await supabase
      .from("businesses")
      .insert({ owner_id: userId, name: business.name, description: business.description, category: business.category, phone: business.phone, email: business.email })
      .select()
      .single();

    if (bizError) { setError(bizError.message); setLoading(false); return; }

    const { error: shopError } = await supabase.from("shops").insert({
      business_id: biz.id, name: shop.name, description: shop.description,
      address: shop.address, city: shop.city, district: shop.district,
      latitude: shop.latitude, longitude: shop.longitude, phone: shop.phone,
      opening_hours: { mon: { open: "09:00", close: "18:00" }, tue: { open: "09:00", close: "18:00" }, wed: { open: "09:00", close: "18:00" }, thu: { open: "09:00", close: "18:00" }, fri: { open: "09:00", close: "18:00" }, sat: { open: "10:00", close: "16:00" } },
      allows_pickup: shop.allows_pickup, allows_delivery: shop.allows_delivery,
    });

    if (shopError) { setError(shopError.message); setLoading(false); return; }

    await supabase.from("profiles").update({ role: "seller" }).eq("id", userId);
    router.push("/seller/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set up your shop</h1>
          <p className="text-gray-600 mt-1">Complete these steps to start selling on StockSpot</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 2 && <div className={`w-16 h-0.5 ${step > s ? "bg-teal-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}

        {step === 1 && (
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Business Information</h2></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Business name" value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} placeholder="e.g. ABC Hardware Store" required />
              <Input label="Business phone" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} placeholder="98XXXXXXXX" required />
              <Input label="Business email (optional)" type="email" value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} />
              <Select label="Business category" value={business.category} onChange={(e) => setBusiness({ ...business, category: e.target.value })} options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))} />
              <Input label="Description (optional)" value={business.description} onChange={(e) => setBusiness({ ...business, description: e.target.value })} placeholder="Brief description of your business" />
              <Button className="w-full" size="lg" onClick={() => { if (!business.name || !business.phone) { setError("Business name and phone are required"); return; } setError(""); setStep(2); }}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Shop Location</h2></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Shop name" value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} placeholder="e.g. ABC Hardware - Main Branch" required />
              <Input label="Address" value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} placeholder="Full street address" required />
              <Select label="City" value={shop.city} onChange={(e) => setShop({ ...shop, city: e.target.value })} options={CITIES.map((c) => ({ value: c, label: c }))} />
              <Input label="District (optional)" value={shop.district} onChange={(e) => setShop({ ...shop, district: e.target.value })} />
              <Input label="Shop phone" value={shop.phone} onChange={(e) => setShop({ ...shop, phone: e.target.value })} placeholder="98XXXXXXXX" required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Latitude" type="number" value={shop.latitude} onChange={(e) => setShop({ ...shop, latitude: parseFloat(e.target.value) })} />
                <Input label="Longitude" type="number" value={shop.longitude} onChange={(e) => setShop({ ...shop, longitude: parseFloat(e.target.value) })} />
              </div>
              <Button variant="outline" onClick={handleGetLocation} className="w-full">Use my current location</Button>
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
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button className="flex-1" size="lg" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Setting up..." : "Complete setup"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
