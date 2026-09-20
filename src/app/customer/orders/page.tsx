"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getTimeAgo } from "@/lib/helpers";
import { Package, Clock, Store, ShoppingBag } from "lucide-react";

interface OrderData {
  id: string;
  status: string;
  fulfillment_type: string;
  total_amount: number;
  created_at: string;
  branch: { name: string; merchant: { business_name: string } } | null;
  items: { product: { name: string }; quantity: number; unit_price: number }[] | null;
}

interface ReservationData {
  id: string;
  quantity: number;
  status: string;
  expires_at: string;
  created_at: string;
  product: { name: string; brand: string } | null;
  branch: { name: string; city: string } | null;
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "reservations">("orders");
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orderData } = await supabase
        .from("orders")
        .select("*, branch:merchant_branches(name, merchant:merchants(business_name)), items:order_items(product:products(name), quantity, unit_price)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      const { data: resData } = await supabase
        .from("reservations")
        .select("*, product:products(name, brand), branch:merchant_branches(name, city)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      setOrders((orderData as OrderData[]) || []);
      setReservations((resData as unknown as ReservationData[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    picked_up: "bg-green-100 text-green-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders & Reservations</h1>

      <div className="flex gap-2 mb-6">
        {(["orders", "reservations"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab} ({tab === "orders" ? orders.length : reservations.length})
          </button>
        ))}
      </div>

      {activeTab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          Order #{order.id.slice(0, 8)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || ""}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.branch?.name || "Shop"} &middot; {order.fulfillment_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
                      <p className="text-xs text-gray-500">{getTimeAgo(order.created_at)}</p>
                    </div>
                  </div>
                  {order.items && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-sm text-gray-600">
                          {item.product.name} x {item.quantity} @ {formatCurrency(item.unit_price)}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "reservations" && (
        <div className="space-y-4">
          {reservations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reservations yet</p>
              </CardContent>
            </Card>
          ) : (
            reservations.map((res) => (
              <Card key={res.id}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {res.product?.name || "Product"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[res.status] || ""}`}>
                          {res.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        <Store className="w-3 h-3 inline mr-1" />
                        {res.branch?.name || "Shop"} &middot; Qty: {res.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires: {new Date(res.expires_at).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500">{getTimeAgo(res.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
