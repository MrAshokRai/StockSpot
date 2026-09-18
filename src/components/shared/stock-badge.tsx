"use client";

import { Badge } from "@/components/ui/badge";
import { getStockConfidence, getTimeAgo } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";

interface StockBadgeProps {
  quantity: number;
  reservedQuantity: number;
  lastUpdated: string;
  showQuantity?: boolean;
  compact?: boolean;
}

export function StockBadge({
  quantity,
  reservedQuantity,
  lastUpdated,
  showQuantity = true,
  compact = false,
}: StockBadgeProps) {
  const available = quantity - reservedQuantity;
  const confidence = getStockConfidence(lastUpdated);

  if (available <= 0) {
    return (
      <Badge variant="danger" size={compact ? "sm" : "md"}>
        <XCircle className="w-3 h-3 mr-1" />
        Out of stock
      </Badge>
    );
  }

  if (confidence.color === "red") {
    return (
      <Badge variant="warning" size={compact ? "sm" : "md"}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        {showQuantity ? `${available} available` : "May be unavailable"}
      </Badge>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", compact ? "text-xs" : "text-sm")}>
      <Badge
        variant={available <= 3 ? "warning" : "success"}
        size={compact ? "sm" : "md"}
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        {showQuantity ? `${available} available` : "In stock"}
      </Badge>
      {!compact && (
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {getTimeAgo(lastUpdated)}
        </span>
      )}
    </div>
  );
}
