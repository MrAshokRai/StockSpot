import type { StockFreshnessInfo } from "@/types";

export function getStockConfidence(
  lastUpdated: string,
  recentSales?: number
): StockFreshnessInfo {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffMinutes =
    (now.getTime() - updated.getTime()) / (1000 * 60);

  if (diffMinutes < 30) {
    return {
      confidence: "high",
      last_updated: lastUpdated,
      label: "Updated recently",
      color: "green",
    };
  } else if (diffMinutes < 240) {
    return {
      confidence: "medium",
      last_updated: lastUpdated,
      label: "Stock may have changed",
      color: "yellow",
    };
  }
  return {
    confidence: "low",
    last_updated: lastUpdated,
    label: "Stock may be outdated",
    color: "red",
  };
}

export function formatStockConfidence(info: StockFreshnessInfo): string {
  const timeAgo = getTimeAgo(info.last_updated);
  return `${info.label} (${timeAgo})`;
}

export function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffSeconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString()}`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getDemandGapLabel(
  searchCount: number,
  availableShops: number
): "very_high" | "high" | "medium" | "low" {
  const ratio = availableShops > 0 ? searchCount / availableShops : searchCount;
  if (ratio > 50) return "very_high";
  if (ratio > 20) return "high";
  if (ratio > 5) return "medium";
  return "low";
}

export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
