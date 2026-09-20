"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Store, Search } from "lucide-react";

interface SellerData {
  id: string;
  user_id: string | null;
  business_name: string;
  business_registration_no: string | null;
  category: string;
  contact_phone: string;
  verification_status: string;
  is_verified: boolean;
  trust_score: number;
  created_at: string;
  owner: { full_name: string; email: string; seller_status?: string } | null;
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const supabase = createClient();

  const fetchSellers = async () => {
    const { data } = await supabase
      .from("merchants")
      .select("*, owner:profiles(full_name, email, seller_status)")
      .order("created_at", { ascending: false });
    setSellers((data as unknown as SellerData[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleVerification = async (seller: SellerData, status: "verified" | "rejected") => {
    if (status === "verified") {
      // Atomic RPC execution to update merchant + profile
      const { error } = await supabase.rpc("approve_seller_application", { p_business_id: seller.id });
      if (error) {
        // Direct fallback update if RPC unavailable
        await supabase
          .from("merchants")
          .update({ verification_status: "verified", verified_at: new Date().toISOString() })
          .eq("id", seller.id);
        if (seller.user_id) {
          await supabase
            .from("profiles")
            .update({ seller_status: "seller_verified", role: "seller" })
            .eq("id", seller.user_id);
        }
      }
    } else {
      const { error } = await supabase.rpc("reject_seller_application", { p_business_id: seller.id });
      if (error) {
        await supabase
          .from("merchants")
          .update({ verification_status: "rejected", verified_at: null, verified_by: null })
          .eq("id", seller.id);
        if (seller.user_id) {
          await supabase
            .from("profiles")
            .update({ seller_status: "customer", role: "customer" })
            .eq("id", seller.user_id);
        }
      }
    }

    fetchSellers();
  };

  const filtered = sellers.filter((s) => {
    const matchesSearch =
      s.business_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.owner?.full_name && s.owner.full_name.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (s.owner?.email && s.owner.email.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesStatus = filterStatus === "all" || s.verification_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    verified: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Seller Verification</h1>
      <p className="text-sm text-gray-600 mb-6">{sellers.length} registered sellers</p>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sellers by business or owner name/email..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No sellers found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((seller) => (
            <Card key={seller.id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                      <Store className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{seller.business_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[seller.verification_status] || ""}`}>
                          {seller.verification_status}
                        </span>
                        {seller.owner?.seller_status && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Status: {seller.owner.seller_status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium text-gray-900">Owner:</span> {seller.owner?.full_name || "N/A"} &middot; {seller.owner?.email || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Category: {seller.category} &middot; Phone: {seller.contact_phone} &middot; Trust Score: {(seller.trust_score * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  {seller.verification_status === "pending" && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" onClick={() => handleVerification(seller, "verified")}>
                        <Check className="w-3 h-3 mr-1" /> Verify
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleVerification(seller, "rejected")}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
