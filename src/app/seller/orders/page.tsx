"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getTimeAgo } from "@/lib/helpers";
import { ShoppingBag, Check, X, Clock, Package } from "lucide-react";

interface OrderData {
  id: string;
  customer_id: string;
  status: string;
  fulfillment_type: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  customer: { full_name: string; email: string } | null;
  items: { id: string; product: { name: string }; quantity: number; unit_price: number }[] | null;
}

interface ReservationData {
  id: string;
  customer_id: string;
  quantity: number;
  status: string;
  expires_at: string;
  created_at: string;
  customer: { full_name: string } | null;
  product: { name: string } | null;
  shop: { name: string } | null;
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "reservations">("orders");
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).single();
      if (!biz) { setLoading(false); return; }

      const { data: shops } = await supabase.from("shops").select("id").eq("business_id", biz.id);
      const shopIds = (shops || []).map((s: { id: string }) => s.id);
      if (shopIds.length === 0) { setLoading(false); return; }

      const { data: orderData } = await supabase
        .from("orders")
        .select("*, customer:profiles(full_name, email), items:order_items(id, product(name), quantity, unit_price)")
        .in("shop_id", shopIds)
        .order("created_at", { ascending: false });

      const { data: resData } = await supabase
        .from("reservations")
        .select("*, customer:profiles(full_name), product(name), shop(name)")
        .in("shop_id", shopIds)
        .order("created_at", { ascending: false });

      setOrders(((orderData || []) as unknown as Record<string, unknown>[]).map((o) => ({
        ...o,
        customer: Array.isArray(o.customer) ? o.customer[0] : o.customer,
        items: Array.isArray(o.items)
          ? o.items.map((it: Record<string, unknown>) => ({
              ...it,
              product: Array.isArray(it.product) ? it.product[0] : it.product,
            }))
          : o.items,
      })) as unknown as OrderData[]);
      setReservations(((resData || []) as unknown as Record<string, unknown>[]).map((r) => ({
        ...r,
        customer: Array.isArray(r.customer) ? r.customer[0] : r.customer,
        product: Array.isArray(r.product) ? r.product[0] : r.product,
        shop: Array.isArray(r.shop) ? r.shop[0] : r.shop,
      })) as unknown as ReservationData[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const updateReservationStatus = async (resId: string, newStatus: string) => {
    await supabase.from("reservations").update({ status: newStatus }).eq("id", resId);
    setReservations((prev) => prev.map((r) => r.id === resId ? { ...r, status: newStatus } : r));
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    preparing: "bg-blue-100 text-blue-800",
    ready: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    picked_up: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders & Reservations</h1>

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
            <Card><CardContent className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders yet</p>
            </CardContent></Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">#{order.id.slice(0, 8)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || ""}`}>
                          {order.status}
                        </span>
                        <Badge variant="outline" size="sm">{order.fulfillment_type}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.customer?.full_name || "Customer"} &middot; {getTimeAgo(order.created_at)}
                      </p>
                      {order.items && (
                        <div className="mt-2">
                          {order.items.map((item) => (
                            <p key={item.id} className="text-sm text-gray-600">
                              {item.product.name} x {item.quantity} @ {formatCurrency(item.unit_price)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
                      <div className="flex gap-1 mt-2">
                        {order.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => updateOrderStatus(order.id, "confirmed")}>
                              <Check className="w-3 h-3 mr-1" /> Confirm
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => updateOrderStatus(order.id, "cancelled")}>
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {order.status === "confirmed" && (
                          <Button size="sm" onClick={() => updateOrderStatus(order.id, "preparing")}>
                            Prepare
                          </Button>
                        )}
                        {order.status === "preparing" && (
                          <Button size="sm" onClick={() => updateOrderStatus(order.id, "ready")}>
                            Ready
                          </Button>
                        )}
                        {order.status === "ready" && order.fulfillment_type === "pickup" && (
                          <Button size="sm" onClick={() => updateOrderStatus(order.id, "picked_up")}>
                            Picked up
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "reservations" && (
        <div className="space-y-4">
          {reservations.length === 0 ? (
            <Card><CardContent className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No reservations yet</p>
            </CardContent></Card>
          ) : (
            reservations.map((res) => (
              <Card key={res.id}>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{res.product?.name || "Product"}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[res.status] || ""}`}>
                          {res.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {res.customer?.full_name || "Customer"} &middot; Qty: {res.quantity}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        Expires: {new Date(res.expires_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {res.status === "active" && (
                        <>
                          <Button size="sm" onClick={() => updateReservationStatus(res.id, "confirmed")}>
                            <Check className="w-3 h-3 mr-1" /> Confirm
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateReservationStatus(res.id, "cancelled")}>
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {res.status === "confirmed" && (
                        <Button size="sm" onClick={() => updateReservationStatus(res.id, "picked_up")}>
                          Picked up
                        </Button>
                      )}
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
