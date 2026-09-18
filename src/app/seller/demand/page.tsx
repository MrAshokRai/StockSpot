"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDemandGapLabel } from "@/lib/helpers";
import { TrendingUp, Search, MapPin, AlertTriangle, BarChart3, ArrowUpRight } from "lucide-react";

interface DemandData {
  product_name: string;
  product_id: string;
  search_count: number;
  available_shops: number;
  city: string;
  first_seen: string;
  last_seen: string;
}

interface ProductRequestData {
  id: string;
  query_text: string;
  city: string;
  request_count: number;
  status: string;
  created_at: string;
}

export default function SellerDemandPage() {
  const [demand, setDemand] = useState<DemandData[]>([]);
  const [requests, setRequests] = useState<ProductRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trends" | "requests">("trends");
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: demandData } = await supabase
        .from("v_demand_summary")
        .select("*")
        .order("search_count", { ascending: false });

      const { data: reqData } = await supabase
        .from("product_requests")
        .select("*")
        .eq("status", "open")
        .order("request_count", { ascending: false });

      setDemand((demandData as DemandData[]) || []);
      setRequests((reqData as ProductRequestData[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const gapColors: Record<string, string> = {
    very_high: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Demand Intelligence</h1>
        <p className="text-sm text-gray-600">
          See what customers are looking for and discover stocking opportunities
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="text-center py-6">
            <Search className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {demand.reduce((s, d) => s + d.search_count, 0)}
            </p>
            <p className="text-xs text-gray-500">Total searches this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-6">
            <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {demand.filter((d) => d.available_shops < 3).length}
            </p>
            <p className="text-xs text-gray-500">High-demand low-supply gaps</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-6">
            <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            <p className="text-xs text-gray-500">Unfulfilled product requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mb-6">
        {(["trends", "requests"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "trends" && (
        <div className="space-y-4">
          {demand.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No demand data available yet</p>
              </CardContent>
            </Card>
          ) : (
            demand.map((d, i) => {
              const gap = getDemandGapLabel(d.search_count, d.available_shops);
              return (
                <Card key={i}>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{d.product_name}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Search className="w-3 h-3" />
                              {d.search_count} searches
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {d.city}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={gap === "very_high" || gap === "high" ? "danger" : gap === "medium" ? "warning" : "success"} size="sm">
                          {gap.replace("_", " ")} demand
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {d.available_shops} shops currently stock this
                        </p>
                      </div>
                    </div>
                    {d.available_shops < 3 && (
                      <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-800 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          <strong>Stocking opportunity:</strong> High demand with limited supply in this area.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No open product requests</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((req) => (
              <Card key={req.id}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{req.query_text}</h3>
                        <Badge variant="warning" size="sm">{req.request_count} requests</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {req.city}
                        </span>
                        <span>{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Customers are actively looking for this product. Consider adding it to your inventory.
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
