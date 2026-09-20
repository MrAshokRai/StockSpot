"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StockBadge } from "@/components/shared/stock-badge";
import { SellerBadge } from "@/components/shared/seller-badge";
import { getStockConfidence, formatCurrency, formatDistance, getTimeAgo } from "@/lib/helpers";
import {
  Search,
  MapPin,
  Clock,
  ChevronRight,
  Package,
  Store,
  Filter,
  Navigation,
  AlertCircle,
} from "lucide-react";

interface SearchResult {
  inventory_item_id: string;
  product_id: string;
  product_name: string;
  brand: string | null;
  model: string | null;
  normalized_name: string;
  shop_id: string;
  shop_name: string;
  city: string;
  latitude: number;
  longitude: number;
  business_name: string;
  is_verified: boolean;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  price: number;
  last_updated: string;
  stock_confidence: string;
}

export default function CustomerSearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
      <CustomerSearchContent />
    </Suspense>
  );
}

function CustomerSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cityFilter, setCityFilter] = useState("");
  const [requestCount, setRequestCount] = useState(0);
  const [hasRequested, setHasRequested] = useState(false);
  const supabase = createClient();

  const getCities = async () => {
    const { data } = await supabase
      .from("shops")
      .select("city")
      .eq("is_active", true)
      .order("city");
    return [...new Set((data || []).map((s: { city: string }) => s.city))];
  };
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    getCities().then((c) => setCities(c as string[]));
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);

    // Record demand signal
    supabase.from("demand_signals").insert({
      query_text: searchQuery.trim(),
      signal_type: "search",
      city: userLocation ? "current" : "unknown",
      latitude: userLocation?.lat,
      longitude: userLocation?.lng,
    });

    // Search products
    const { data: products } = await supabase
      .from("products")
      .select("id, name, normalized_name")
      .or(`name.ilike.%${searchQuery}%,normalized_name.ilike.%${searchQuery}%,search_keywords.cs.{${searchQuery.toLowerCase()}}`)
      .eq("is_active", true)
      .limit(50);

    if (!products || products.length === 0) {
      setResults([]);
      setLoading(false);

      // Check product requests
      const { data: reqs } = await supabase
        .from("product_requests")
        .select("request_count")
        .ilike("query_text", searchQuery.trim())
        .eq("status", "open");
      if (reqs && reqs.length > 0) {
        setRequestCount(reqs.reduce((s: number, r: { request_count: number }) => s + r.request_count, 0));
      }
      return;
    }

    const productIds = products.map((p: { id: string }) => p.id);

    let inventoryQuery = supabase
      .from("v_stock_availability")
      .select("*")
      .in("product_id", productIds)
      .gt("available_quantity", 0);

    if (cityFilter) {
      inventoryQuery = inventoryQuery.eq("city", cityFilter);
    }

    const { data: inventory } = await inventoryQuery.limit(100);

    setResults((inventory as SearchResult[]) || []);
    setLoading(false);
  }, [userLocation, cityFilter, supabase]);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/customer/search?q=" + encodeURIComponent(query.trim()));
  };

  const handleRequestProduct = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login?redirect=/customer/search");
      return;
    }
    // Secure RPC: increments count cross-user, owner set server-side (no client spoofing)
    const { error } = await supabase.rpc("request_product", {
      p_query_text: query.trim(),
      p_city: userLocation ? "current" : "unknown",
    });
    if (error) {
      // Fallback to direct insert (own row only per RLS)
      supabase.from("product_requests").upsert(
        {
          user_id: user.id,
          query_text: query.trim(),
          city: userLocation ? "current" : "unknown",
          latitude: userLocation?.lat,
          longitude: userLocation?.lng,
          request_count: 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "query_text,city" }
      );
    }
    setHasRequested(true);
    setRequestCount((c) => c + 1);
  };

  const groupedResults = results.reduce(
    (acc: Record<string, SearchResult[]>, r: SearchResult) => {
      if (!acc[r.product_id]) acc[r.product_id] = [];
      acc[r.product_id].push(r);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products... (e.g. Bosch drill, rice 25kg, iPhone 15)"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm"
            />
          </div>
          <Select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            options={[
              { value: "", label: "All cities" },
              ...cities.map((c) => ({ value: c, label: c })),
            ]}
            className="w-40"
          />
          <Button type="submit" size="lg">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </form>

      {!searched && (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Find any product, anywhere
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Search for a product to see which verified shops have it in stock, with real-time availability and pricing.
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Searching inventory...</p>
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No shops found with this product
          </h2>
          {requestCount > 0 && (
            <p className="text-gray-600 mb-4">
              <strong>{requestCount}</strong> customers in this area are also looking for this product.
            </p>
          )}
          {!hasRequested ? (
            <Button onClick={handleRequestProduct} variant="secondary">
              <Package className="w-4 h-4 mr-2" />
              Request this product ({requestCount + 1} requests)
            </Button>
          ) : (
            <Badge variant="success" size="md">
              Request submitted! Sellers will be notified.
            </Badge>
          )}
        </div>
      )}

      {searched && !loading && results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Found <strong>{results.length}</strong> results across{" "}
              <strong>{Object.keys(groupedResults).length}</strong> products
            </p>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedResults).map(([productId, items]) => {
              const first = items[0];
              return (
                <Card key={productId}>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {first.product_name}
                          </h3>
                          {first.brand && (
                            <Badge variant="outline" size="sm">{first.brand}</Badge>
                          )}
                        </div>
                        {first.model && (
                          <p className="text-xs text-gray-500 mb-2">Model: {first.model}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.inventory_item_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Store className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <Link href={`/customer/shop/${item.shop_id}`}>
                                  <span className="font-medium text-sm text-gray-900 hover:text-teal-600 hover:underline">
                                    {item.shop_name}
                                  </span>
                                </Link>
                                <SellerBadge isVerified={item.is_verified} showLabel={false} />
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" />
                                {item.city}
                                {item.latitude && userLocation && (
                                  <span>
                                    ({formatDistance(
                                      Math.sqrt(
                                        Math.pow((item.latitude - userLocation.lat) * 111000, 2) +
                                        Math.pow((item.longitude - userLocation.lng) * 111000, 2)
                                      )
                                    )})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <StockBadge
                              quantity={item.quantity}
                              reservedQuantity={item.reserved_quantity}
                              lastUpdated={item.last_updated}
                              compact
                            />
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                            <Link
                              href={
                                "/customer/product/" +
                                item.inventory_item_id
                              }
                            >
                              <Button size="sm" variant="outline">
                                View
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
