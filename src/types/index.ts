export type UserRole = 'customer' | 'merchant' | 'admin';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order';

export type ReservationStatus = 'active' | 'fulfilled' | 'cancelled' | 'expired';

export type InquiryStatus = 'pending' | 'quoted' | 'accepted' | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  merchantId?: string;
  createdAt: string;
}

export interface MerchantBranch {
  id: string;
  merchantId: string;
  branchName: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  isMain: boolean;
  operatingHours: string;
}

export interface Merchant {
  id: string;
  userId?: string;
  businessName: string;
  businessRegistrationNo: string;
  category: string;
  description: string;
  trustScore: number; // 0 to 100
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  contactPhone: string;
  contactEmail: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  branches: MerchantBranch[];
  freshnessGuaranteeHours: number;
  lastInventoryUpdate: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export interface Product {
  id: string;
  merchantId: string;
  branchId?: string;
  categoryId?: string;
  name: string;
  normalizedName: string;
  category: string;
  sku: string;
  barcode?: string;
  description: string;
  price: number;
  wholesalePrice?: number;
  moq: number; // Minimum Order Quantity
  unit: string;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  freshnessDate: string;
  freshnessHash: string;
  tags: string[];
  specifications?: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  productId: string;
  productName: string;
  merchantId: string;
  merchantName: string;
  branchId?: string;
  branchName?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: ReservationStatus;
  pickupCode: string;
  fulfillmentType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  notes?: string;
  expiresAt: string;
  createdAt: string;
}

export interface RFQInquiry {
  id: string;
  productId: string;
  productName: string;
  merchantId: string;
  merchantName: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedQuantity: number;
  targetPrice?: number;
  message: string;
  quotedPrice?: number;
  status: InquiryStatus;
  responseMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockoutRequest {
  id: string;
  customerId?: string;
  customerName: string;
  customerContact: string;
  queryText: string;
  category: string;
  targetQuantity: number;
  locationCity: string;
  maxRadiusKm: number;
  status: 'seeking' | 'matched' | 'fulfilled' | 'closed';
  matchedMerchantId?: string;
  matchedMerchantName?: string;
  notes?: string;
  createdAt: string;
}

export interface DemandSignal {
  id: string;
  queryTerm: string;
  category: string;
  searchCount: number;
  unmetCount: number;
  estimatedDemandValue: number;
  locationCluster: string;
  trendDirection: 'rising' | 'stable' | 'explosive';
  detectedAt: string;
  sampleItemMatch?: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  ipHash: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface SearchFilterState {
  query: string;
  category: string;
  city: string;
  maxDistanceKm: number;
  userLat: number;
  userLng: number;
  inStockOnly: boolean;
  verifiedOnly: boolean;
  minTrustScore: number;
  wholesaleOnly: boolean;
  sortBy: 'distance' | 'price_asc' | 'price_desc' | 'trust_score' | 'freshness';
}

export interface AIIntentResult {
  rawQuery: string;
  extractedProduct: string;
  extractedQuantity?: number;
  extractedCategory?: string;
  extractedLocation?: string;
  isUrgent: boolean;
  isWholesale: boolean;
  confidence: number;
}

export interface SubstituteRecommendation {
  product: Product;
  merchant: Merchant;
  matchScore: number;
  priceDifference: number;
  distanceKm: number;
  matchReason: string;
}
