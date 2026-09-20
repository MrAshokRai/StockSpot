"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Store, CheckCircle, User, Building2, MapPin } from "lucide-react";

const CITIES = [
  "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan",
  "Biratnagar", "Birgunj", "Butwal", "Dharan", "Hetauda",
  "Itahari", "Nepalgunj", "Dhangadhi", "Janakpur", "Bharatpur",
];

const SHOP_TYPES = [
  { value: "grocery_store", label: "Grocery Store" },
  { value: "supermarket", label: "Supermarket" },
  { value: "clothing_fashion", label: "Clothing & Fashion" },
  { value: "shoes_footwear", label: "Shoes & Footwear" },
  { value: "electronics", label: "Electronics" },
  { value: "mobile_accessories", label: "Mobile & Accessories" },
  { value: "computers_it", label: "Computers & IT" },
  { value: "home_furniture", label: "Home & Furniture" },
  { value: "appliances", label: "Appliances" },
  { value: "beauty_cosmetics", label: "Beauty & Cosmetics" },
  { value: "health_pharmacy", label: "Health & Pharmacy" },
  { value: "jewelry_accessories", label: "Jewelry & Accessories" },
  { value: "sports_fitness", label: "Sports & Fitness" },
  { value: "toys_games", label: "Toys & Games" },
  { value: "books_stationery", label: "Books & Stationery" },
  { value: "automotive", label: "Automotive" },
  { value: "hardware_tools", label: "Hardware & Tools" },
  { value: "construction_materials", label: "Construction & Building Materials" },
  { value: "food_bakery", label: "Food & Bakery" },
  { value: "restaurant_cafe", label: "Restaurant & Café" },
  { value: "fruits_vegetables", label: "Fruits & Vegetables" },
  { value: "meat_seafood", label: "Meat & Seafood" },
  { value: "bakery_confectionery", label: "Bakery & Confectionery" },
  { value: "pet_supplies", label: "Pet Supplies" },
  { value: "baby_kids", label: "Baby & Kids" },
  { value: "flowers_gifts", label: "Flowers & Gifts" },
  { value: "art_craft", label: "Art & Craft" },
  { value: "agriculture_farming", label: "Agriculture & Farming" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other / Miscellaneous" },
];

const TOTAL_STEPS = 3;

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  // Step 1: Personal information
  const [personal, setPersonal] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

  // Step 2: Business / shop information
  const [business, setBusiness] = useState({
    businessName: "",
    shopType: "grocery_store",
    description: "",
    email: "",
    phone: "",
  });

  // Step 3: Shop location
  const [shop, setShop] = useState({
    shopName: "",
    address: "",
    city: "Kathmandu",
    district: "",
    phone: "",
    latitude: 27.7172,
    longitude: 85.324,
    allows_pickup: true,
    allows_delivery: false,
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login?redirect=/seller/onboarding");
        return;
      }
      setUserId(user.id);

      // Check if already pending or verified
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, seller_status")
        .eq("id", user.id)
        .single();

      if (profile?.seller_status === "seller_verified") {
        router.push("/seller/dashboard");
        return;
      }
      if (profile?.seller_status === "seller_pending") {
        router.push("/seller/pending");
        return;
      }

      // Pre-fill personal info from profile
      if (profile) {
        setPersonal((p) => ({
          ...p,
          fullName: profile.full_name || "",
          phone: profile.phone || "",
        }));
      }
    };
    getUser();
  }, []);

  const handleGetLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setShop({ ...shop, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {}
    );
  };

  const validateStep = (s: number): string => {
    if (s === 1) {
      if (!personal.fullName.trim()) return "Full name is required";
      if (!personal.phone.trim()) return "Phone number is required";
      if (personal.phone.trim().length < 7) return "Enter a valid phone number";
    }
    if (s === 2) {
      if (!business.businessName.trim()) return "Business name is required";
      if (!business.phone.trim()) return "Business phone is required";
    }
    if (s === 3) {
      if (!shop.shopName.trim()) return "Shop name is required";
      if (!shop.address.trim()) return "Shop address is required";
      if (!shop.phone.trim()) return "Shop phone is required";
    }
    return "";
  };

  const handleNext = () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const validationError = validateStep(3);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!userId) return;

    setLoading(true);
    setError("");

    // Update personal info on profile (phone, name if changed)
    await supabase
      .from("profiles")
      .update({
        full_name: personal.fullName,
        phone: personal.phone,
      })
      .eq("id", userId);

    // Create merchant record (canonical table)
    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .insert({
        user_id: userId,
        business_name: business.businessName,
        business_registration_no: null,
        category: business.shopType,
        description: business.description,
        verification_status: "pending",
        contact_phone: business.phone || personal.phone,
        contact_email: business.email || null,
        website: null,
        address: shop.address,
        city: shop.city,
        state: "Bagmati",
        latitude: shop.latitude,
        longitude: shop.longitude,
        trust_score: 0,
        rating: 0,
        review_count: 0,
      })
      .select()
      .single();

    if (merchantError) {
      setError(merchantError.message);
      setLoading(false);
      return;
    }

    // Create merchant branch record (canonical table)
    const { error: branchError } = await supabase.from("merchant_branches").insert({
      merchant_id: merchant.id,
      branch_name: shop.shopName,
      address: shop.address,
      city: shop.city,
      latitude: shop.latitude,
      longitude: shop.longitude,
      phone: shop.phone,
      is_main: true,
      operating_hours: "09:00-18:00",
    });

    if (branchError) {
      setError(branchError.message);
      setLoading(false);
      return;
    }

    // Set seller_status to seller_pending via server function
    const { error: statusError } = await supabase.rpc("set_seller_pending");
    if (statusError) {
      setError(statusError.message);
      setLoading(false);
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem("toast_message", "Application submitted — pending review");
    }
    router.push("/customer/search?applied=true");
  };

  const stepLabels = [
    { icon: User, label: "Personal Info" },
    { icon: Building2, label: "Business Info" },
    { icon: MapPin, label: "Shop Location" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Application</h1>
          <p className="text-gray-600 mt-1">
            Tell us about yourself and your business. Our team will review and approve your application.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {stepLabels.map((s, i) => {
            const stepNum = i + 1;
            const Icon = s.icon;
            const isCompleted = step > stepNum;
            const isActive = step === stepNum;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isCompleted
                        ? "bg-teal-600 text-white"
                        : isActive
                        ? "bg-teal-600 text-white ring-2 ring-teal-200"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-teal-700" : "text-gray-500"}`}>
                    {s.label}
                  </span>
                </div>
                {i < TOTAL_STEPS - 1 && (
                  <div className={`w-16 h-0.5 mb-4 ${step > stepNum ? "bg-teal-600" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* Step 1 — Personal Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Personal Information</h2>
              <p className="text-sm text-gray-500">Your contact details for seller verification</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Full legal name"
                value={personal.fullName}
                onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                placeholder="As it appears on your ID"
                required
              />
              <Input
                label="Phone number"
                type="tel"
                value={personal.phone}
                onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                placeholder="98XXXXXXXX"
                required
              />
              <Input
                label="Your address (optional)"
                value={personal.address}
                onChange={(e) => setPersonal({ ...personal, address: e.target.value })}
                placeholder="Street address or area"
              />
              <Button className="w-full" size="lg" onClick={handleNext}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Business / Shop Information */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Business Information</h2>
              <p className="text-sm text-gray-500">Details about your shop or business</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Business / shop name"
                value={business.businessName}
                onChange={(e) => setBusiness({ ...business, businessName: e.target.value })}
                placeholder="e.g. ABC Hardware Store"
                required
              />
              <Select
                label="Shop type"
                value={business.shopType}
                onChange={(e) => setBusiness({ ...business, shopType: e.target.value })}
                options={SHOP_TYPES}
              />
              <Input
                label="Business phone"
                type="tel"
                value={business.phone}
                onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                placeholder="98XXXXXXXX"
                required
              />
              <Input
                label="Business email (optional)"
                type="email"
                value={business.email}
                onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                placeholder="business@example.com"
              />
              <Input
                label="Business description (optional)"
                value={business.description}
                onChange={(e) => setBusiness({ ...business, description: e.target.value })}
                placeholder="Brief description of your business"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button className="flex-1" size="lg" onClick={handleNext}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Shop Location */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Shop Location</h2>
              <p className="text-sm text-gray-500">Where customers can find your shop</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Shop / branch name"
                value={shop.shopName}
                onChange={(e) => setShop({ ...shop, shopName: e.target.value })}
                placeholder="e.g. ABC Hardware - Main Branch"
                required
              />
              <Input
                label="Street address"
                value={shop.address}
                onChange={(e) => setShop({ ...shop, address: e.target.value })}
                placeholder="Full street address"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="City"
                  value={shop.city}
                  onChange={(e) => setShop({ ...shop, city: e.target.value })}
                  options={CITIES.map((c) => ({ value: c, label: c }))}
                />
                <Input
                  label="District (optional)"
                  value={shop.district}
                  onChange={(e) => setShop({ ...shop, district: e.target.value })}
                  placeholder="e.g. Thamel"
                />
              </div>
              <Input
                label="Shop phone"
                type="tel"
                value={shop.phone}
                onChange={(e) => setShop({ ...shop, phone: e.target.value })}
                placeholder="98XXXXXXXX"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  type="number"
                  value={shop.latitude}
                  onChange={(e) => setShop({ ...shop, latitude: parseFloat(e.target.value) || 27.7172 })}
                />
                <Input
                  label="Longitude"
                  type="number"
                  value={shop.longitude}
                  onChange={(e) => setShop({ ...shop, longitude: parseFloat(e.target.value) || 85.324 })}
                />
              </div>
              <Button variant="outline" onClick={handleGetLocation} className="w-full">
                <MapPin className="w-4 h-4 mr-2" />
                Use my current location
              </Button>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shop.allows_pickup}
                    onChange={(e) => setShop({ ...shop, allows_pickup: e.target.checked })}
                    className="rounded"
                  />
                  Allow pickup
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shop.allows_delivery}
                    onChange={(e) => setShop({ ...shop, allows_delivery: e.target.checked })}
                    className="rounded"
                  />
                  Allow delivery
                </label>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  After submitting, your application will be reviewed by our team (typically 1–3 business days).
                  You&apos;ll continue to have full customer access while it&apos;s being reviewed.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button className="flex-1" size="lg" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
