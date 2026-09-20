"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SellerOnboardingPage from "@/app/seller/onboarding/page";

export default function SellerApplyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "customer" | "seller_pending" | "seller_verified">("loading");
  const supabase = createClient();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login?redirect=/seller/apply");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("seller_status")
        .eq("id", user.id)
        .single();

      const sellerStatus = profile?.seller_status || "customer";

      if (sellerStatus === "seller_verified") {
        router.push("/seller/dashboard");
        return;
      }

      setStatus(sellerStatus as "customer" | "seller_pending");
    };

    checkStatus();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "seller_pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Under Review</h1>
          <p className="text-gray-600 mb-8">
            Your seller application has been submitted and is being reviewed by our team. 
            You&apos;ll be notified once it&apos;s approved.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left mb-6">
            <p className="text-sm font-medium text-yellow-800 mb-1">What happens next?</p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Our team reviews your business information</li>
              <li>• Verification typically takes 1–3 business days</li>
              <li>• You&apos;ll receive access to the seller dashboard once approved</li>
            </ul>
          </div>
          <Link href="/customer/search">
            <Button variant="outline" className="w-full">
              Continue as Customer
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // status === "customer" — render seller application form
  return <SellerOnboardingPage />;
}
