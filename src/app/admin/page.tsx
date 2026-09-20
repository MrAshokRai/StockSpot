"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Store, Package, ShoppingBag, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  totalShops: number;
  verifiedShops: number;
  totalProducts: number;
  totalOrders: number;
  pendingVerifications: number;
  totalDemandSignals: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, totalSellers: 0, totalShops: 0, verifiedShops: 0,
    totalProducts: 0, totalOrders: 0, pendingVerifications: 0, totalDemandSignals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<{ action: string; entity_type: string; created_at: string; user: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      const [users, sellers, shops, verified, products, orders, pending, demand] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "seller"),
        supabase.from("merchant_branches").select("*", { count: "exact", head: true }),
        supabase.from("merchant_branches").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("merchants").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
        supabase.from("demand_signals").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: users.count || 0,
        totalSellers: sellers.count || 0,
        totalShops: shops.count || 0,
        verifiedShops: verified.count || 0,
        totalProducts: products.count || 0,
        totalOrders: orders.count || 0,
        pendingVerifications: pending.count || 0,
        totalDemandSignals: demand.count || 0,
      });

      const { data: logs } = await supabase
        .from("audit_logs")
        .select("action, entity_type, created_at, user:profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(10);

      setRecentActivity(
        (logs || []).map((l: Record<string, unknown>) => ({
          action: l.action as string,
          entity_type: l.entity_type as string,
          created_at: l.created_at as string,
          user: (l.user as { full_name?: string } | null)?.full_name || "System",
        }))
      );
      setLoading(false);
    };
    fetchStats();
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
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <Badge variant="danger" size="md">
          <ShieldCheck className="w-4 h-4 mr-1" />
          Admin Access
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Sellers", value: stats.totalSellers, icon: Store, color: "bg-green-50 text-green-600" },
          { label: "Shops", value: stats.totalShops, icon: Store, color: "bg-teal-50 text-teal-600" },
          { label: "Products", value: stats.totalProducts, icon: Package, color: "bg-purple-50 text-purple-600" },
          { label: "Orders", value: stats.totalOrders, icon: ShoppingBag, color: "bg-indigo-50 text-indigo-600" },
          { label: "Demand Signals", value: stats.totalDemandSignals, icon: TrendingUp, color: "bg-orange-50 text-orange-600" },
          { label: "Pending Verifications", value: stats.pendingVerifications, icon: AlertTriangle, color: "bg-yellow-50 text-yellow-600" },
          { label: "Verified Shops", value: stats.verifiedShops, icon: ShieldCheck, color: "bg-green-50 text-green-600" },
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
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/sellers" className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Review Seller Verifications</p>
                  <p className="text-xs text-gray-500">{stats.pendingVerifications} pending</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/users" className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Manage Users</p>
                  <p className="text-xs text-gray-500">{stats.totalUsers} total users</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/analytics" className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">View Analytics</p>
                  <p className="text-xs text-gray-500">Platform-wide metrics</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.action}</p>
                      <p className="text-xs text-gray-500">{a.entity_type} &middot; {a.user}</p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</p>
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
