"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTimeAgo } from "@/lib/helpers";
import { Package, MapPin, Clock } from "lucide-react";

interface RequestData {
  id: string;
  query_text: string;
  city: string;
  status: string;
  request_count: number;
  created_at: string;
}

export default function CustomerRequestsPage() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("product_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setRequests((data as RequestData[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Product Requests</h1>
      <p className="text-gray-600 text-sm mb-6">
        Products you requested that are not currently available in shops.
      </p>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No product requests yet</p>
            <p className="text-sm text-gray-400 mt-1">
              When you search for a product that no shop has, you can request it.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{req.query_text}</span>
                      <Badge variant={req.status === "open" ? "info" : "success"}>
                        {req.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {req.city}
                      </span>
                      <span>{req.request_count} customers looking</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getTimeAgo(req.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
