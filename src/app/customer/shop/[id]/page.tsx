"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SellerBadge } from "@/components/shared/seller-badge";
import { StockBadge } from "@/components/shared/stock-badge";
import { formatCurrency } from "@/lib/helpers";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Navigation,
  Package,
  Search,
  ArrowLeft,
  Share2,
  Check,
} from "lucide-react";

interface ShopDetails {
  id: string;
  branch_name: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  operating_hours: Record<string, string> | null;
  merchant: {
    id: string;
    business_name: string;
    description: string | null;
    verification_status: string;
    trust_score: number;
    contact_email: string | null;
    contact_phone: string | null;
  } | null;
}

interface InventoryItem {
  inventory_item_id: string;
  product_id: string;
  product_name: string;
  brand: string | null;
  model: string | null;
  description: string | null;
  category_name?: string;
  price: number;
  available_quantity: number;
  stock_confidence: string;
  last_updated: string;
}

export default function PublicShopPage() {
  const params = useParams();
  const shopId = params.id as string;
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchShopAndInventory = async () => {
      if (!shopId) return;

      // 1. Fetch branch + merchant details
      const { data: branchData, error: branchErr } = await supabase
        .from("merchant_branches")
        .select("*, merchant:merchants(id, business_name, description, verification_status, trust_score, contact_email, contact_phone)")
        .eq("id", shopId)
        .maybeSingle();

      if (branchData) {
        setShop({
          ...branchData,
          merchant: Array.isArray(branchData.merchant) ? branchData.merchant[0] : branchData.merchant,
        } as unknown as ShopDetails);
      } else {
        // In case merchant_id was provided instead of branch_id
        const { data: altBranch } = await supabase
          .from("merchant_branches")
          .select("*, merchant:merchants(id, business_name, description, verification_status, trust_score, contact_email, contact_phone)")
          .eq("merchant_id", shopId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (altBranch) {
          setShop({
            ...altBranch,
            merchant: Array.isArray(altBranch.merchant) ? altBranch.merchant[0] : altBranch.merchant,
          } as unknown as ShopDetails);
        }
      }

      // 2. Fetch live inventory items for this branch
      const targetBranchId = branchData?.id;
      if (targetBranchId) {
        const { data: stockData } = await supabase
          .from("v_stock_availability")
          .select("*")
          .eq("shop_id", targetBranchId);

        setItems((stockData as unknown as InventoryItem[]) || []);
      }

      setLoading(false);
    };

    fetchShopAndInventory();
  }, [shopId]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.product_name?.toLowerCase().includes(q) ||
      item.brand?.toLowerCase().includes(q) ||
      item.model?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading shop profile...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop Not Found</h2>
        <p className="text-gray-600 mb-6">The store you are looking for does not exist or has been deactivated.</p>
        <Link href="/customer/search">
          <Button variant="primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Explore Other Stores
          </Button>
        </Link>
      </div>
    );
  }

  const isVerified = shop.merchant?.verification_status === "verified";
  const mapLink = shop.latitude && shop.longitude
    ? `https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.branch_name || shop.name}, ${shop.address}, ${shop.city}`)}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/customer/search" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to search
        </Link>
        <Button variant="outline" size="sm" onClick={handleShare} className="text-xs">
          {copied ? <Check className="w-3.5 h-3.5 mr-1 text-green-600" /> : <Share2 className="w-3.5 h-3.5 mr-1" />}
          {copied ? "Link Copied!" : "Share Store"}
        </Button>
      </div>

      {/* Store Header Card */}
      <Card className="border-teal-100 bg-gradient-to-r from-teal-50/50 via-white to-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                <Store className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{shop.branch_name || shop.name}</h1>
                  <SellerBadge isVerified={isVerified} />
                </div>
                <p className="text-sm font-medium text-teal-700">
                  {shop.merchant?.business_name}
                </p>
                {shop.merchant?.description && (
                  <p className="text-sm text-gray-600 max-w-2xl mt-1">
                    {shop.merchant.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-600 pt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {shop.address}, {shop.city}{shop.district ? `, ${shop.district}` : ""}
                  </span>
                  {shop.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${shop.phone}`} className="hover:underline text-teal-700 font-medium">
                        {shop.phone}
                      </a>
                    </span>
                  )}
                  {shop.merchant?.contact_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${shop.merchant.contact_email}`} className="hover:underline">
                        {shop.merchant.contact_email}
                      </a>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2.5 flex-shrink-0">
              <a href={mapLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full justify-center">
                  <Navigation className="w-4 h-4 mr-1.5 text-teal-600" />
                  Get Directions
                </Button>
              </a>
              {shop.phone && (
                <a href={`tel:${shop.phone}`}>
                  <Button variant="primary" size="sm" className="w-full justify-center">
                    <Phone className="w-4 h-4 mr-1.5" />
                    Call Store
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Inventory Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              Live Available Products ({items.length})
            </h2>
            <p className="text-xs text-gray-500">Real-time inventory available at this branch.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search store inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No products match your search</p>
              <p className="text-xs text-gray-400 mt-1">This branch may be updating their stock catalog.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.inventory_item_id} className="hover:border-teal-200 transition-all shadow-xs flex flex-col justify-between">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{item.product_name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.brand && <Badge variant="outline" size="sm">{item.brand}</Badge>}
                        {item.model && <Badge variant="outline" size="sm">{item.model}</Badge>}
                      </div>
                    </div>
                    <StockBadge
                      quantity={item.available_quantity}
                      reservedQuantity={0}
                      lastUpdated={item.last_updated}
                      compact
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  {item.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-baseline justify-between pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400 block">Price</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(item.price)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Stock</span>
                      <span className="text-sm font-medium text-gray-700">{item.available_quantity} available</span>
                    </div>
                  </div>
                  <Link href={`/customer/product/${item.inventory_item_id}`} className="block">
                    <Button variant="primary" size="sm" className="w-full text-xs">
                      View & Reserve Item
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
