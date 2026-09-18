"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getTimeAgo, getDemandGapLabel } from "@/lib/helpers";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Clock,
  Store,
  ArrowRight,
  DollarSign,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface ShopData {
  id: string;
  name: string;
  business_id: string;
}

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  pendingReservations: number;
  todaySales: number;
  inventoryValue: number;
  demandOpportunities: number;
}

interface LowStockItem {
  product_name: string;
  quantity: number;
  last_updated: string;
}

interface DemandOpportunity {
  product_name: string;
  search_count: number;
  available_shops: number;
  demand_gap: string;
}

interface RecentOrder {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  customer: { full_name: string } | null;
  items: { product: { name: string }; quantity: number }[] | null;
}

export default function SellerDashboardPage() {
  const [shop, setShop] = useState<ShopData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0, lowStockProducts: 0, pendingOrders: 0,
    pendingReservations: 0, todaySales: 0, inventoryValue: 0, demandOpportunities: 0,
  });
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [demandOpps, setDemandOpps] = useState<DemandOpportunity[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: businesses } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id);

      if (!businesses || businesses.length === 0) {
        setLoading(false);
        return;
      }

      const bizIds = businesses.map((b: { id: string }) => b.id);
      const { data: shops } = await supabase
        .from("shops")
        .select("id, name, business_id")
        .in("business_id", bizIds);

      if (!shops || shops.length === 0) {
        setLoading(false);
        return;
      }

      const shopIds = shops.map((s: { id: string }) => s.id);
      const currentShop = shops[0] as ShopData;
      setShop(currentShop);

      // Inventory stats
      const { data: inventory } = await supabase
        .from("inventory_items")
        .select("id, quantity, price, last_updated, product(name)")
        .in("shop_id", shopIds);

      const inv = (inventory || []) as unknown as Record<string, unknown>[];
      const totalProducts = inv.length;
      const lowStockItems = inv.filter((i: Record<string, unknown>) => (i.quantity as number) <= 5 && (i.quantity as number) > 0);
      const inventoryValue = inv.reduce((sum: number, i: Record<string, unknown>) => sum + (i.quantity as number) * (i.price as number), 0);

      setLowStock(lowStockItems.map((i: Record<string, unknown>) => ({
        product_name: Array.isArray(i.product) ? (i.product as { name: string }[])?.[0]?.name || "Unknown" : (i.product as { name: string })?.name || "Unknown",
        quantity: i.quantity as number,
        last_updated: i.last_updated as string,
      })));

      // Pending orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at, customer:profiles(full_name), items:order_items(quantity, product(name))")
        .in("shop_id", shopIds)
        .order("created_at", { ascending: false })
        .limit(5);

      const pendingOrders = (orders || []).filter((o: { status: string }) => ["pending", "confirmed"].includes(o.status)).length;

      // Pending reservations
      const { count: pendingRes } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .in("shop_id", shopIds)
        .eq("status", "active");

      // Demand opportunities from city
      const city = currentShop.name ? "Kathmandu" : "unknown";
      const { data: demand } = await supabase
        .from("v_demand_summary")
        .select("*")
        .order("search_count", { ascending: false })
        .limit(5);

      setDemandOpps((demand || []).map((d: { product_name: string; search_count: number; available_shops: number }) => ({
        product_name: d.product_name,
        search_count: d.search_count,
        available_shops: d.available_shops,
        demand_gap: getDemandGapLabel(d.search_count, d.available_shops),
      })));

      setStats({
        totalProducts,
        lowStockProducts: lowStockItems.length,
        pendingOrders,
        pendingReservations: pendingRes || 0,
        todaySales: 0,
        inventoryValue,
        demandOpportunities: (demand || []).length,
      });

      setRecentOrders((orders || []) as unknown as RecentOrder[]);
      setLoading(false);
    };

    fetchDashboard();
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
          {shop && <p className="text-sm text-gray-600">{shop.name}</p>}
        </div>
        <Link href="/seller/inventory">
          <Badge variant="info" size="md">
            <Store className="w-4 h-4 mr-1" />
            Manage Inventory
          </Badge>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Products", value: stats.totalProducts, icon: Package, color: "bg-blue-50 text-blue-600" },
          { label: "Low Stock", value: stats.lowStockProducts, icon: AlertTriangle, color: "bg-yellow-50 text-yellow-600" },
          { label: "Pending Orders", value: stats.pendingOrders, icon: ShoppingBag, color: "bg-green-50 text-green-600" },
          { label: "Reservations", value: stats.pendingReservations, icon: Clock, color: "bg-purple-50 text-purple-600" },
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

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold text-gray-900">Low Stock Alerts</h2>
            <Link href="/seller/inventory" className="text-sm text-teal-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">All products are well-stocked</p>
            ) : (
              <div className="space-y-2">
                {lowStock.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-yellow-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-900">{item.product_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-yellow-700">{item.quantity} left</span>
                      <p className="text-xs text-gray-500">{getTimeAgo(item.last_updated)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold text-gray-900">Demand Opportunities</h2>
            <Link href="/seller/demand" className="text-sm text-teal-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {demandOpps.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No demand data available yet</p>
            ) : (
              <div className="space-y-2">
                {demandOpps.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{d.product_name}</span>
                      <p className="text-xs text-gray-500">{d.available_shops} shops currently stock this</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={d.demand_gap === "very_high" || d.demand_gap === "high" ? "danger" : "warning"} size="sm">
                        {d.search_count} searches
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/seller/orders" className="text-sm text-teal-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        #{order.id.slice(0, 8)}
                      </span>
                      <Badge variant={order.status === "pending" ? "warning" : "info"} size="sm">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.customer?.full_name || "Customer"} &middot; {getTimeAgo(order.created_at)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
