export type UserRole = "customer" | "seller" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  category: string;
  phone: string;
  email?: string;
  website?: string;
  logo_url?: string;
  is_verified: boolean;
  verification_status: "pending" | "verified" | "rejected";
  trust_score: number;
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  phone: string;
  opening_hours?: Record<string, { open: string; close: string }>;
  is_active: boolean;
  allows_pickup: boolean;
  allows_delivery: boolean;
  delivery_radius_km?: number;
  created_at: string;
  updated_at: string;
  business?: Business;
  distance?: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  icon?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category_id: string;
  brand?: string;
  model?: string;
  variant?: string;
  sku?: string;
  barcode?: string;
  unit: string;
  image_url?: string;
  attributes?: Record<string, string>;
  normalized_name: string;
  search_keywords: string[];
  is_active: boolean;
  created_at: string;
  category?: ProductCategory;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  shop_id: string;
  branch_id?: string;
  quantity: number;
  reserved_quantity: number;
  price: number;
  wholesale_price?: number;
  min_order_quantity: number;
  last_updated: string;
  last_sold_at?: string;
  is_available: boolean;
  product?: Product;
  shop?: Shop;
  available_quantity: number;
  stock_confidence: "high" | "medium" | "low";
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type FulfillmentType = "pickup" | "delivery";

export interface Order {
  id: string;
  customer_id: string;
  shop_id: string;
  status: OrderStatus;
  fulfillment_type: FulfillmentType;
  total_amount: number;
  notes?: string;
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  shop?: Shop;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export interface Reservation {
  id: string;
  customer_id: string;
  shop_id: string;
  inventory_item_id: string;
  quantity: number;
  status: "active" | "confirmed" | "picked_up" | "expired" | "cancelled";
  expires_at: string;
  created_at: string;
  product?: Product;
  shop?: Shop;
}

export type DemandSignalType =
  | "search"
  | "product_request"
  | "reservation_attempt"
  | "unavailable_search";

export interface DemandSignal {
  id: string;
  product_id?: string;
  query_text: string;
  signal_type: DemandSignalType;
  city: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  user_id?: string;
  created_at: string;
  product?: Product;
}

export interface ProductRequest {
  id: string;
  user_id?: string;
  query_text: string;
  category_id?: string;
  city: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  status: "open" | "fulfilled" | "closed";
  request_count: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "demand";
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface DemandInsight {
  product_name: string;
  product_id: string;
  search_count: number;
  available_shops: number;
  demand_gap: "very_high" | "high" | "medium" | "low";
  city: string;
}

export interface StockFreshnessInfo {
  confidence: "high" | "medium" | "low";
  last_updated: string;
  label: string;
  color: "green" | "yellow" | "red";
}
