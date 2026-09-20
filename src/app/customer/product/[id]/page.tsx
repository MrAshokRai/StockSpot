"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StockBadge } from "@/components/shared/stock-badge";
import { SellerBadge } from "@/components/shared/seller-badge";
import { formatCurrency, getTimeAgo } from "@/lib/helpers";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Store,
  Phone,
  Package,
  ShoppingBag,
  MessageSquare,
  CheckCircle,
  Navigation,
} from "lucide-react";

interface ProductDetail {
  inventory_item_id: string;
  product_id: string;
  merchant_id: string;
  product_name: string;
  brand: string | null;
  model: string | null;
  description: string | null;
  shop_id: string;
  shop_name: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  business_name: string;
  is_verified: boolean;
  trust_score: number;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  price: number;
  wholesale_price: number | null;
  min_order_quantity: number;
  last_updated: string;
  stock_confidence: string;
  phone: string;
  address: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inventoryId = params.id as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserveQty, setReserveQty] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase
        .from("v_stock_availability")
        .select("*")
        .eq("inventory_item_id", inventoryId)
        .single();
      setProduct(data as ProductDetail | null);
      setLoading(false);
    };
    fetchProduct();
  }, [inventoryId]);

  const handleReserve = async () => {
    setReserving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login?redirect=/customer/product/" + inventoryId);
      return;
    }
    if (!product) {
      setReserving(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const totalPrice = product.price * reserveQty;

    const { data: reservation, error } = await supabase.from("reservations").insert({
      customer_id: user.id,
      merchant_id: product.merchant_id,
      branch_id: product.shop_id,
      inventory_item_id: product.inventory_item_id,
      customer_name: profile?.full_name || "Customer",
      customer_phone: profile?.phone || "",
      customer_email: user.email ?? null,
      quantity: reserveQty,
      total_price: totalPrice,
      pickup_code: Math.random().toString(36).slice(2, 8).toUpperCase(),
      expires_at: expiresAt,
    }).select("pickup_code").single();

    if (!error) {
      await supabase.rpc("increment_reserved", {
        p_id: product.inventory_item_id,
        p_qty: reserveQty,
      });

      if (typeof window !== "undefined") {
        sessionStorage.setItem("pickup_code", (reservation as { pickup_code: string } | null)?.pickup_code ?? "");
      }
      setReserved(true);
    }
    setReserving(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-600">Product not found.</p>
        <a href="/customer/search">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to search
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <a href="/customer/search" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to search
      </a>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Package className="w-7 h-7 text-gray-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{product.product_name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {product.brand && <Badge variant="outline">{product.brand}</Badge>}
                    {product.model && <Badge variant="outline">{product.model}</Badge>}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Unit:</span>
                  <span className="ml-2 text-gray-900">
                    {product.min_order_quantity > 1 ? `Min ${product.min_order_quantity}` : "Piece"}
                  </span>
                </div>
                {product.wholesale_price && (
                  <div>
                    <span className="text-gray-500">Wholesale:</span>
                    <span className="ml-2 text-gray-900">{formatCurrency(product.wholesale_price)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Shop Details</h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{product.shop_name}</h3>
                    <SellerBadge isVerified={product.is_verified} />
                  </div>
                  <p className="text-sm text-gray-600">{product.business_name}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {product.address}, {product.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {product.phone}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <a
                  href={`https://www.google.com/maps?q=${product.latitude},${product.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <Navigation className="w-4 h-4 mr-2" />
                    Get directions
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Ask the seller</h2>
            </CardHeader>
            <CardContent>
              {showInquiry ? (
                <div className="space-y-3">
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Type your question about this product..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      setInquiryMessage("");
                      setShowInquiry(false);
                    }}
                  >
                    Send inquiry
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {["Is this currently available?", "Can I reserve this?", "Is bulk quantity available?"].map(
                    (q) => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInquiryMessage(q);
                          setShowInquiry(true);
                        }}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {q}
                      </Button>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="elevated">
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</p>
                {product.wholesale_price && (
                  <p className="text-sm text-gray-500 mt-1">
                    Wholesale: {formatCurrency(product.wholesale_price)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 mb-4">
                <StockBadge
                  quantity={product.quantity}
                  reservedQuantity={product.reserved_quantity}
                  lastUpdated={product.last_updated}
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
                <Clock className="w-3 h-3" />
                Updated {getTimeAgo(product.last_updated)}
              </div>

              {reserved ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-700">Reserved successfully!</p>
                  <p className="text-sm text-gray-500 mt-1">Pick up within 30 minutes</p>
                  <a href="/customer/orders">
                    <Button variant="outline" size="sm" className="mt-3">
                      View my reservations
                    </Button>
                  </a>
                </div>
              ) : product.available_quantity > 0 ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity to reserve
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReserveQty(Math.max(1, reserveQty - 1))}
                        className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium">{reserveQty}</span>
                      <button
                        onClick={() => setReserveQty(Math.min(product.available_quantity, reserveQty + 1))}
                        className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleReserve}
                    disabled={reserving}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    {reserving ? "Reserving..." : "Reserve for pickup"}
                  </Button>
                  <p className="text-xs text-center text-gray-500">Pick up within 30 minutes</p>
                </div>
              ) : (
                <Button className="w-full" variant="outline" disabled>
                  Out of stock
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Stock confidence</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  High: Updated within 30 minutes
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  Medium: Updated within 4 hours
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  Low: Stock may be outdated
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
