import {
  Product,
  Merchant,
  Category,
  Reservation,
  RFQInquiry,
  StockoutRequest,
  DemandSignal,
  UserProfile,
  UserRole,
  SearchFilterState,
  VerificationStatus,
  StockStatus
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_MERCHANTS,
  INITIAL_PRODUCTS,
  INITIAL_DEMAND_SIGNALS,
  INITIAL_STOCKOUT_REQUESTS,
  INITIAL_RESERVATIONS,
  INITIAL_RFQS
} from './mockData';
import { generateFreshnessHashSync, generatePickupCode } from '../utils/crypto';
import { auditLogger, sanitizeInput } from './security';

type Listener = () => void;

class StockSpotStore {
  private categories: Category[] = [];
  private merchants: Merchant[] = [];
  private products: Product[] = [];
  private reservations: Reservation[] = [];
  private rfqs: RFQInquiry[] = [];
  private stockoutRequests: StockoutRequest[] = [];
  private demandSignals: DemandSignal[] = [];

  // Active Session State
  private currentUser: UserProfile = {
    id: 'user_cust_demo',
    email: 'customer@stockspot.np',
    fullName: 'Aayush Adhikari',
    role: 'customer',
    phone: '+977-9841234567',
    createdAt: new Date().toISOString()
  };

  private activeMerchantId: string = 'merch_pioneer_hardware';
  private activeBranchId: string = 'branch_pioneer_main';

  private filterState: SearchFilterState = {
    query: '',
    category: 'All',
    city: 'All',
    maxDistanceKm: 25,
    userLat: 27.7172,
    userLng: 85.3240,
    inStockOnly: false,
    verifiedOnly: false,
    minTrustScore: 0,
    wholesaleOnly: false,
    sortBy: 'distance'
  };

  private listeners: Set<Listener> = new Set();
  private static STORAGE_PREFIX = 'stockspot_db_v2_';

  constructor() {
    this.initStore();
  }

  private initStore() {
    try {
      const storedProds = localStorage.getItem(StockSpotStore.STORAGE_PREFIX + 'products');
      const storedMerchs = localStorage.getItem(StockSpotStore.STORAGE_PREFIX + 'merchants');
      const storedRes = localStorage.getItem(StockSpotStore.STORAGE_PREFIX + 'reservations');
      const storedRfqs = localStorage.getItem(StockSpotStore.STORAGE_PREFIX + 'rfqs');
      const storedDemands = localStorage.getItem(StockSpotStore.STORAGE_PREFIX + 'demands');
      const storedStockouts = localStorage.getItem(StockSpotStore.STORAGE_PREFIX + 'stockouts');
      const storedUser = localStorage.getItem(StockSpotStore.STORAGE_PREFIX + 'currentUser');

      this.categories = INITIAL_CATEGORIES;
      this.merchants = storedMerchs ? JSON.parse(storedMerchs) : INITIAL_MERCHANTS;
      this.products = storedProds ? JSON.parse(storedProds) : INITIAL_PRODUCTS;
      this.reservations = storedRes ? JSON.parse(storedRes) : INITIAL_RESERVATIONS;
      this.rfqs = storedRfqs ? JSON.parse(storedRfqs) : INITIAL_RFQS;
      this.demandSignals = storedDemands ? JSON.parse(storedDemands) : INITIAL_DEMAND_SIGNALS;
      this.stockoutRequests = storedStockouts ? JSON.parse(storedStockouts) : INITIAL_STOCKOUT_REQUESTS;
      
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
    } catch (e) {
      this.resetToDemoDefaults();
    }
  }

  private persist() {
    try {
      localStorage.setItem(StockSpotStore.STORAGE_PREFIX + 'products', JSON.stringify(this.products));
      localStorage.setItem(StockSpotStore.STORAGE_PREFIX + 'merchants', JSON.stringify(this.merchants));
      localStorage.setItem(StockSpotStore.STORAGE_PREFIX + 'reservations', JSON.stringify(this.reservations));
      localStorage.setItem(StockSpotStore.STORAGE_PREFIX + 'rfqs', JSON.stringify(this.rfqs));
      localStorage.setItem(StockSpotStore.STORAGE_PREFIX + 'demands', JSON.stringify(this.demandSignals));
      localStorage.setItem(StockSpotStore.STORAGE_PREFIX + 'stockouts', JSON.stringify(this.stockoutRequests));
      localStorage.setItem(StockSpotStore.STORAGE_PREFIX + 'currentUser', JSON.stringify(this.currentUser));
    } catch (e) {
      // LocalStorage quota or privacy mode
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.persist();
    for (const listener of this.listeners) {
      listener();
    }
  }

  public resetToDemoDefaults() {
    this.categories = INITIAL_CATEGORIES;
    this.merchants = INITIAL_MERCHANTS;
    this.products = INITIAL_PRODUCTS;
    this.reservations = INITIAL_RESERVATIONS;
    this.rfqs = INITIAL_RFQS;
    this.demandSignals = INITIAL_DEMAND_SIGNALS;
    this.stockoutRequests = INITIAL_STOCKOUT_REQUESTS;
    this.currentUser = {
      id: 'user_cust_demo',
      email: 'customer@stockspot.np',
      fullName: 'Aayush Adhikari',
      role: 'customer',
      phone: '+977-9841234567',
      createdAt: new Date().toISOString()
    };
    this.activeMerchantId = 'merch_pioneer_hardware';
    this.activeBranchId = 'branch_pioneer_main';
    auditLogger.logAction('system', 'RESET_DEMO_DATA', 'store', 'all', { timestamp: Date.now() });
    this.notify();
  }

  // --- Getters ---
  public getCategories(): Category[] {
    return this.categories;
  }

  public getMerchants(): Merchant[] {
    return this.merchants;
  }

  public getMerchantById(id: string): Merchant | undefined {
    return this.merchants.find(m => m.id === id);
  }

  public getProducts(): Product[] {
    return this.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  public getReservations(): Reservation[] {
    return this.reservations;
  }

  public getRFQs(): RFQInquiry[] {
    return this.rfqs;
  }

  public getStockoutRequests(): StockoutRequest[] {
    return this.stockoutRequests;
  }

  public getDemandSignals(): DemandSignal[] {
    return this.demandSignals;
  }

  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public getActiveMerchantId(): string {
    return this.activeMerchantId;
  }

  public getActiveBranchId(): string {
    return this.activeBranchId;
  }

  public getFilterState(): SearchFilterState {
    return { ...this.filterState };
  }

  // --- Session & Role Management ---
  public switchRole(role: UserRole, merchantId?: string) {
    if (role === 'customer') {
      this.currentUser = {
        id: 'user_cust_demo',
        email: 'customer@stockspot.np',
        fullName: 'Aayush Adhikari (Buyer)',
        role: 'customer',
        phone: '+977-9841234567',
        createdAt: this.currentUser.createdAt
      };
    } else if (role === 'merchant') {
      const selectedMerchant = this.merchants.find(m => m.id === (merchantId || this.activeMerchantId)) || this.merchants[0];
      this.activeMerchantId = selectedMerchant.id;
      this.activeBranchId = selectedMerchant.branches[0]?.id || '';
      this.currentUser = {
        id: `user_${selectedMerchant.id}`,
        email: selectedMerchant.contactEmail,
        fullName: `${selectedMerchant.businessName} (Manager)`,
        role: 'merchant',
        merchantId: selectedMerchant.id,
        phone: selectedMerchant.contactPhone,
        createdAt: this.currentUser.createdAt
      };
    } else if (role === 'admin') {
      this.currentUser = {
        id: 'user_admin_super',
        email: 'security.auditor@stockspot.gov.np',
        fullName: 'Admin & Trust Officer',
        role: 'admin',
        createdAt: this.currentUser.createdAt
      };
    }
    auditLogger.logAction(this.currentUser.role, 'SWITCH_ROLE', 'user', this.currentUser.id, { newRole: role });
    this.notify();
  }

  public setActiveMerchant(merchantId: string, branchId?: string) {
    this.activeMerchantId = merchantId;
    const merch = this.getMerchantById(merchantId);
    if (merch) {
      this.activeBranchId = branchId || merch.branches[0]?.id || '';
    }
    this.notify();
  }

  public setActiveBranch(branchId: string) {
    this.activeBranchId = branchId;
    this.notify();
  }

  public setFilterState(partial: Partial<SearchFilterState>) {
    this.filterState = { ...this.filterState, ...partial };
    this.notify();
  }

  // --- Product Management (Merchant CRUD) ---
  public addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'freshnessHash'>): Product {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();
    const freshnessHash = generateFreshnessHashSync(
      productData.merchantId,
      productData.sku,
      productData.stockQuantity,
      now.slice(0, 10)
    );

    const newProduct: Product = {
      ...productData,
      id,
      name: sanitizeInput(productData.name),
      normalizedName: productData.name.toLowerCase().trim(),
      description: sanitizeInput(productData.description),
      freshnessDate: now,
      freshnessHash,
      createdAt: now,
      updatedAt: now
    };

    this.products.unshift(newProduct);
    
    // Update merchant's lastInventoryUpdate
    this.updateMerchantLastTimestamp(newProduct.merchantId);

    auditLogger.logAction(
      this.currentUser.role,
      'CREATE_PRODUCT',
      'product',
      id,
      { name: newProduct.name, sku: newProduct.sku, qty: newProduct.stockQuantity },
      this.currentUser.id
    );

    this.notify();
    return newProduct;
  }

  public updateProduct(productId: string, updates: Partial<Product>): Product | undefined {
    const idx = this.products.findIndex(p => p.id === productId);
    if (idx === -1) return undefined;

    const current = this.products[idx];
    const now = new Date().toISOString();

    const newQty = updates.stockQuantity !== undefined ? updates.stockQuantity : current.stockQuantity;
    let newStatus: StockStatus = current.stockStatus;
    if (newQty <= 0) newStatus = 'out_of_stock';
    else if (newQty <= (updates.lowStockThreshold || current.lowStockThreshold)) newStatus = 'low_stock';
    else newStatus = 'in_stock';

    const freshnessHash = generateFreshnessHashSync(
      current.merchantId,
      updates.sku || current.sku,
      newQty,
      now.slice(0, 10)
    );

    const updated: Product = {
      ...current,
      ...updates,
      name: updates.name ? sanitizeInput(updates.name) : current.name,
      description: updates.description ? sanitizeInput(updates.description) : current.description,
      stockQuantity: newQty,
      stockStatus: newStatus,
      freshnessDate: now,
      freshnessHash,
      updatedAt: now
    };

    this.products[idx] = updated;
    this.updateMerchantLastTimestamp(current.merchantId);

    auditLogger.logAction(
      this.currentUser.role,
      'UPDATE_PRODUCT',
      'product',
      productId,
      { changes: Object.keys(updates), newQty },
      this.currentUser.id
    );

    this.notify();
    return updated;
  }

  public deleteProduct(productId: string): boolean {
    const idx = this.products.findIndex(p => p.id === productId);
    if (idx === -1) return false;
    
    const prod = this.products[idx];
    this.products.splice(idx, 1);
    
    auditLogger.logAction(
      this.currentUser.role,
      'DELETE_PRODUCT',
      'product',
      productId,
      { name: prod.name, sku: prod.sku },
      this.currentUser.id
    );

    this.notify();
    return true;
  }

  public quickAdjustStock(productId: string, delta: number): Product | undefined {
    const prod = this.products.find(p => p.id === productId);
    if (!prod) return undefined;
    const newQty = Math.max(0, prod.stockQuantity + delta);
    return this.updateProduct(productId, { stockQuantity: newQty });
  }

  public reverifyProductStock(productId: string): Product | undefined {
    const prod = this.products.find(p => p.id === productId);
    if (!prod) return undefined;
    return this.updateProduct(productId, { stockQuantity: prod.stockQuantity });
  }

  // --- Batch CSV / Excel Import ---
  public batchImportProducts(
    merchantId: string,
    branchId: string,
    items: Array<{
      name: string;
      category: string;
      sku: string;
      price: number;
      wholesalePrice?: number;
      moq?: number;
      unit?: string;
      stockQuantity: number;
      lowStockThreshold?: number;
      description?: string;
    }>
  ): number {
    let count = 0;
    const now = new Date().toISOString();

    for (const item of items) {
      if (!item.name || !item.price) continue;
      const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const qty = Number(item.stockQuantity) || 0;
      const lowThresh = Number(item.lowStockThreshold) || 5;
      let status: StockStatus = 'in_stock';
      if (qty <= 0) status = 'out_of_stock';
      else if (qty <= lowThresh) status = 'low_stock';

      const hash = generateFreshnessHashSync(merchantId, item.sku || id, qty, now.slice(0, 10));

      this.products.unshift({
        id,
        merchantId,
        branchId,
        name: sanitizeInput(item.name),
        normalizedName: item.name.toLowerCase().trim(),
        category: item.category || 'General',
        sku: item.sku || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        description: sanitizeInput(item.description || item.name),
        price: Number(item.price),
        wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : undefined,
        moq: Number(item.moq) || 1,
        unit: item.unit || 'pcs',
        stockQuantity: qty,
        lowStockThreshold: lowThresh,
        stockStatus: status,
        freshnessDate: now,
        freshnessHash: hash,
        tags: [item.name.toLowerCase(), (item.category || '').toLowerCase()].filter(Boolean),
        isActive: true,
        createdAt: now,
        updatedAt: now
      });
      count++;
    }

    this.updateMerchantLastTimestamp(merchantId);
    auditLogger.logAction(
      this.currentUser.role,
      'BATCH_IMPORT_PRODUCTS',
      'merchant',
      merchantId,
      { count, branchId },
      this.currentUser.id
    );

    this.notify();
    return count;
  }

  // --- Reservations & Orders ---
  public createReservation(data: {
    productId: string;
    quantity: number;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    fulfillmentType: 'pickup' | 'delivery';
    deliveryAddress?: string;
    notes?: string;
  }): Reservation {
    const product = this.getProductById(data.productId);
    if (!product) throw new Error('Product not found');
    if (product.stockQuantity < data.quantity) {
      throw new Error(`Insufficient stock. Only ${product.stockQuantity} ${product.unit} available.`);
    }

    const merchant = this.getMerchantById(product.merchantId);
    const unitPrice = data.quantity >= product.moq && product.wholesalePrice ? product.wholesalePrice : product.price;
    const totalPrice = unitPrice * data.quantity;
    const pickupCode = generatePickupCode('STK');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 4 * 3600000).toISOString(); // 4 hours hold

    const reservation: Reservation = {
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      productId: product.id,
      productName: product.name,
      merchantId: product.merchantId,
      merchantName: merchant ? merchant.businessName : 'Verified Merchant',
      branchId: product.branchId,
      branchName: merchant?.branches.find(b => b.id === product.branchId)?.branchName || 'Main Branch',
      customerId: this.currentUser.id,
      customerName: sanitizeInput(data.customerName),
      customerPhone: sanitizeInput(data.customerPhone),
      customerEmail: data.customerEmail ? sanitizeInput(data.customerEmail) : undefined,
      quantity: data.quantity,
      unitPrice,
      totalPrice,
      status: 'active',
      pickupCode,
      fulfillmentType: data.fulfillmentType,
      deliveryAddress: data.deliveryAddress ? sanitizeInput(data.deliveryAddress) : undefined,
      notes: data.notes ? sanitizeInput(data.notes) : undefined,
      expiresAt,
      createdAt: now.toISOString()
    };

    // Deduct stock quantity immediately to prevent double-booking
    this.quickAdjustStock(product.id, -data.quantity);
    this.reservations.unshift(reservation);

    auditLogger.logAction(
      this.currentUser.role,
      'CREATE_RESERVATION',
      'reservation',
      reservation.id,
      { code: pickupCode, qty: data.quantity, total: totalPrice },
      this.currentUser.id
    );

    this.notify();
    return reservation;
  }

  public fulfillReservation(reservationId: string, inputPickupCode: string): boolean {
    const res = this.reservations.find(r => r.id === reservationId);
    if (!res) return false;
    
    // Validate pickup code
    const cleanCode = inputPickupCode.trim().toUpperCase();
    if (cleanCode !== res.pickupCode.toUpperCase()) {
      auditLogger.logAction(this.currentUser.role, 'FAILED_PICKUP_CODE_VERIFICATION', 'reservation', reservationId, { inputCode: cleanCode });
      return false;
    }

    res.status = 'fulfilled';
    auditLogger.logAction(this.currentUser.role, 'FULFILL_RESERVATION', 'reservation', reservationId, { code: res.pickupCode });
    this.notify();
    return true;
  }

  public cancelReservation(reservationId: string, reason?: string): boolean {
    const res = this.reservations.find(r => r.id === reservationId);
    if (!res || res.status !== 'active') return false;

    res.status = 'cancelled';
    
    // Return stock back to inventory
    this.quickAdjustStock(res.productId, res.quantity);

    auditLogger.logAction(
      this.currentUser.role,
      'CANCEL_RESERVATION',
      'reservation',
      reservationId,
      { restoredQty: res.quantity, reason },
      this.currentUser.id
    );

    this.notify();
    return true;
  }

  // --- B2B RFQs & Wholesale Inquiries ---
  public submitRFQ(data: {
    productId: string;
    requestedQuantity: number;
    targetPrice?: number;
    message: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  }): RFQInquiry {
    const product = this.getProductById(data.productId);
    if (!product) throw new Error('Product not found');
    const merchant = this.getMerchantById(product.merchantId);

    const rfq: RFQInquiry = {
      id: `rfq_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      productId: product.id,
      productName: product.name,
      merchantId: product.merchantId,
      merchantName: merchant?.businessName || 'Verified Merchant',
      customerId: this.currentUser.id,
      customerName: sanitizeInput(data.customerName),
      customerEmail: sanitizeInput(data.customerEmail),
      customerPhone: sanitizeInput(data.customerPhone),
      requestedQuantity: data.requestedQuantity,
      targetPrice: data.targetPrice,
      message: sanitizeInput(data.message),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.rfqs.unshift(rfq);
    auditLogger.logAction(this.currentUser.role, 'SUBMIT_RFQ', 'rfq', rfq.id, { qty: data.requestedQuantity });
    this.notify();
    return rfq;
  }

  public respondToRFQ(rfqId: string, quotedPrice: number, responseMessage: string): boolean {
    const rfq = this.rfqs.find(r => r.id === rfqId);
    if (!rfq) return false;

    rfq.quotedPrice = quotedPrice;
    rfq.responseMessage = sanitizeInput(responseMessage);
    rfq.status = 'quoted';
    rfq.updatedAt = new Date().toISOString();

    auditLogger.logAction(this.currentUser.role, 'RESPOND_RFQ', 'rfq', rfqId, { quotedPrice });
    this.notify();
    return true;
  }

  // --- Stockout Requests & Demand Signal Recording ---
  public submitStockoutRequest(data: {
    queryText: string;
    category: string;
    targetQuantity: number;
    locationCity: string;
    customerName: string;
    customerContact: string;
    notes?: string;
  }): StockoutRequest {
    const req: StockoutRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      customerId: this.currentUser.id,
      customerName: sanitizeInput(data.customerName),
      customerContact: sanitizeInput(data.customerContact),
      queryText: sanitizeInput(data.queryText),
      category: data.category,
      targetQuantity: data.targetQuantity,
      locationCity: data.locationCity,
      maxRadiusKm: 25,
      status: 'seeking',
      notes: data.notes ? sanitizeInput(data.notes) : undefined,
      createdAt: new Date().toISOString()
    };

    this.stockoutRequests.unshift(req);

    // Also auto-increment or create a Demand Signal for this cluster
    this.recordDemandMiss(data.queryText, data.category, data.locationCity, data.targetQuantity);

    auditLogger.logAction(this.currentUser.role, 'SUBMIT_STOCKOUT_REQUEST', 'stockout', req.id, { query: data.queryText });
    this.notify();
    return req;
  }

  public recordDemandMiss(query: string, category: string, location: string, qty: number = 1) {
    const cleanTerm = query.toLowerCase().trim();
    const existing = this.demandSignals.find(
      d => d.queryTerm.toLowerCase().includes(cleanTerm) || cleanTerm.includes(d.queryTerm.toLowerCase())
    );

    if (existing) {
      existing.searchCount += 1;
      existing.unmetCount += 1;
      existing.estimatedDemandValue += Math.max(500, qty * 250);
      existing.trendDirection = existing.unmetCount > 50 ? 'explosive' : 'rising';
      existing.detectedAt = new Date().toISOString();
    } else {
      this.demandSignals.unshift({
        id: `sig_${Date.now()}`,
        queryTerm: query,
        category,
        searchCount: 1,
        unmetCount: 1,
        estimatedDemandValue: Math.max(1000, qty * 450),
        locationCluster: location,
        trendDirection: 'rising',
        detectedAt: new Date().toISOString()
      });
    }
  }

  // --- Admin Governance & Verification ---
  public updateMerchantVerification(merchantId: string, status: VerificationStatus, trustScoreDelta?: number): boolean {
    const merch = this.merchants.find(m => m.id === merchantId);
    if (!merch) return false;

    merch.verificationStatus = status;
    if (status === 'verified') {
      merch.verifiedAt = new Date().toISOString();
      merch.trustScore = Math.min(99.5, Math.max(85.0, merch.trustScore + (trustScoreDelta || 10)));
    } else if (status === 'rejected') {
      merch.trustScore = Math.max(30.0, merch.trustScore - 20);
    }

    auditLogger.logAction(
      this.currentUser.role,
      'UPDATE_MERCHANT_VERIFICATION',
      'merchant',
      merchantId,
      { status, newTrustScore: merch.trustScore },
      this.currentUser.id
    );

    this.notify();
    return true;
  }

  private updateMerchantLastTimestamp(merchantId: string) {
    const merch = this.merchants.find(m => m.id === merchantId);
    if (merch) {
      merch.lastInventoryUpdate = new Date().toISOString();
    }
  }
}

export const store = new StockSpotStore();
