"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, Store, CheckCircle } from "lucide-react";
import Link from "next/link";

interface BusinessInfo {
  name: string;
  category: string;
  phone: string;
  verification_status: string;
}

export default function SellerPendingPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("seller_status")
        .eq("id", user.id)
        .single();

      if (profile?.seller_status === "seller_verified") {
        router.push("/seller/dashboard");
        return;
      }

      if (profile?.seller_status === "customer") {
        router.push("/seller/apply");
        return;
      }

      // seller_pending — load business info (via canonical merchants table)
      const { data: biz } = await supabase
        .from("merchants")
        .select("business_name, category, contact_phone, verification_status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setBusiness(biz ? {
        name: biz.business_name,
        category: biz.category,
        phone: biz.contact_phone,
        verification_status: biz.verification_status,
      } : null);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your seller application is under review</h1>
          <p className="text-gray-600">
            Your seller application has been submitted and is currently being reviewed by our team.
          </p>
        </div>

        {business && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Store className="w-4 h-4 text-teal-600" />
              Submitted Business Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Business name</span>
                <span className="text-sm font-medium text-gray-900">{business.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Category</span>
                <span className="text-sm font-medium text-gray-900">{business.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="text-sm font-medium text-gray-900">{business.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Pending Review
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-medium text-teal-800 mb-3">What happens next?</p>
          <ul className="space-y-2">
            {[
              "Our team reviews your business information",
              "Verification typically takes 1–3 business days",
              "You'll get full seller access once approved",
              "You can keep shopping as a customer in the meantime",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-teal-700">
                <CheckCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Link href="/customer/search">
          <Button variant="outline" className="w-full">
            Return to Customer Mode
          </Button>
        </Link>
      </div>
    </div>
  );
}
