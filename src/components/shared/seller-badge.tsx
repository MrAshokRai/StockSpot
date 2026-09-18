"use client";

import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert } from "lucide-react";

interface SellerBadgeProps {
  isVerified: boolean;
  trustScore?: number;
  showLabel?: boolean;
}

export function SellerBadge({
  isVerified,
  trustScore,
  showLabel = true,
}: SellerBadgeProps) {
  if (isVerified) {
    return (
      <Badge variant="success" size="sm">
        <ShieldCheck className="w-3 h-3 mr-1" />
        {showLabel && "Verified seller"}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" size="sm">
      <ShieldAlert className="w-3 h-3 mr-1" />
      {showLabel && "Unverified"}
    </Badge>
  );
}
