"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, Store, Package, ShoppingBag } from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  usersByRole: { role: string; count: number }[];
  totalShops: number;
  shopsByCity: { city: string; count: number }[];
  totalProducts: number;
  totalOrders: number;
  totalDemandSignals: number;
  demandByType: { signal_type: string; count: number }[];
  topDemandProducts: { product_name: string; search_count: number }[];
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0, usersByRole: [], totalShops: 0, shopsByCity: [],
    totalProducts: 0, totalOrders: 0, totalDemandSignals: 0, demandByType: [], topDemandProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalytics = async () => {
      const [users, shops, products, orders, demand, demandByType, topDemand, shopsByCity] = await Promise.all([
        supabase.from("profiles").select("role"),
        supabase.from("shops").select("city"),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("demand_signals").select("*", { count: "exact", head: true }),
        supabase.from("demand_signals").select("signal_type"),
        supabase.from("v_demand_summary").select("product_name, search_count").order("search_count", { ascending: false }).limit(10),
        supabase.from("shops").select("city"),
      ]);

      const roleCounts: Record<string, number> = {};
      (users.data || []).forEach((u: { role: string }) => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });

      const cityCounts: Record<string, number> = {};
      (shopsByCity.data || []).forEach((s: { city: string }) => { cityCounts[s.city] = (cityCounts[s.city] || 0) + 1; });

      const typeCounts: Record<string, number> = {};
      (demand.data || []).forEach((d: { signal_type: string }) => { typeCounts[d.signal_type] = (typeCounts[d.signal_type] || 0) + 1; });

      setAnalytics({
        totalUsers: users.data?.length || 0,
        usersByRole: Object.entries(roleCounts).map(([role, count]) => ({ role, count })),
        totalShops: shops.data?.length || 0,
        shopsByCity: Object.entries(cityCounts).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count),
        totalProducts: products.count || 0,
        totalOrders: orders.count || 0,
        totalDemandSignals: demand.count || 0,
        demandByType: Object.entries(typeCounts).map(([signal_type, count]) => ({ signal_type, count })),
        topDemandProducts: (topDemand.data || []) as { product_name: string; search_count: number }[],
      });
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Users", value: analytics.totalUsers, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Shops", value: analytics.totalShops, icon: Store, color: "bg-teal-50 text-teal-600" },
          { label: "Products", value: analytics.totalProducts, icon: Package, color: "bg-purple-50 text-purple-600" },
          { label: "Orders", value: analytics.totalOrders, icon: ShoppingBag, color: "bg-green-50 text-green-600" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Users by Role</h2></CardHeader>
          <CardContent>
            {analytics.usersByRole.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No data</p>
            ) : (
              <div className="space-y-2">
                {analytics.usersByRole.map((r) => (
                  <div key={r.role} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <span className="text-sm font-medium text-gray-900 capitalize">{r.role}</span>
                    <Badge variant="outline" size="sm">{r.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Shops by City</h2></CardHeader>
          <CardContent>
            {analytics.shopsByCity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No data</p>
            ) : (
              <div className="space-y-2">
                {analytics.shopsByCity.slice(0, 8).map((c) => (
                  <div key={c.city} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <span className="text-sm font-medium text-gray-900">{c.city}</span>
                    <Badge variant="outline" size="sm">{c.count} shops</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Top Demand Products</h2></CardHeader>
          <CardContent>
            {analytics.topDemandProducts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No demand data yet</p>
            ) : (
              <div className="space-y-2">
                {analytics.topDemandProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <span className="text-sm font-medium text-gray-900">{p.product_name}</span>
                    <Badge variant="danger" size="sm">{p.search_count} searches</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Demand Signals by Type</h2></CardHeader>
          <CardContent>
            {analytics.demandByType.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No data</p>
            ) : (
              <div className="space-y-2">
                {analytics.demandByType.map((d) => (
                  <div key={d.signal_type} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <span className="text-sm font-medium text-gray-900 capitalize">{d.signal_type.replace("_", " ")}</span>
                    <Badge variant="info" size="sm">{d.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
