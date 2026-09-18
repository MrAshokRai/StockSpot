import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { Product, Merchant } from './types';
import { calculateDistanceKm } from './utils/geo';
import { Navbar } from './components/Navbar';
import { HeroSearch } from './components/HeroSearch';
import { ProductCard } from './components/ProductCard';
import { InteractiveMapRadar } from './components/InteractiveMapRadar';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SubstituteFinderModal } from './components/SubstituteFinderModal';
import { StockoutRequestModal } from './components/StockoutRequestModal';
import { MerchantDashboard } from './components/MerchantDashboard';
import { AdminVerificationDashboard } from './components/AdminVerificationDashboard';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { TrustCertificateModal } from './components/TrustCertificateModal';
import { AuthModal } from './components/AuthModal';
import { Toast, ToastMessage } from './components/Toast';
import {
  PackageSearch,
  Sparkles,
  ShieldCheck,
  Radio,
  Building2,
  Lock,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  HeartHandshake
} from 'lucide-react';

export const App: React.FC = () => {
  const [, setTick] = useState(0);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'explore' | 'radar' | 'merchant' | 'admin'>('explore');
  const [viewMode, setViewMode] = useState<'grid' | 'radar'>('grid');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [substituteTargetProduct, setSubstituteTargetProduct] = useState<Product | null>(null);
  const [trustCertMerchant, setTrustCertMerchant] = useState<Merchant | null>(null);
  const [trustCertProduct, setTrustCertProduct] = useState<Product | undefined>(undefined);
  const [showStockoutModal, setShowStockoutModal] = useState(false);
  const [showReservationsModal, setShowReservationsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Subscribe to central reactive store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const products = store.getProducts();
  const merchants = store.getMerchants();
  const filterState = store.getFilterState();
  const currentUser = store.getCurrentUser();

  const merchantMap = new Map(merchants.map((m) => [m.id, m]));

  // Filter products based on search criteria
  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;

    const merchant = merchantMap.get(p.merchantId);
    if (!merchant) return false;

    // Filter by In-Stock
    if (filterState.inStockOnly && p.stockQuantity <= 0) return false;

    // Filter by Verified Merchant KYC
    if (filterState.verifiedOnly && merchant.verificationStatus !== 'verified') return false;

    // Filter by Wholesale
    if (filterState.wholesaleOnly && !p.wholesalePrice) return false;

    // Filter by Category
    if (filterState.category !== 'All' && p.category !== filterState.category) return false;

    // Filter by City
    if (filterState.city !== 'All' && merchant.city !== filterState.city) return false;

    // Filter by Distance Radius
    const distKm = calculateDistanceKm(
      filterState.userLat,
      filterState.userLng,
      merchant.latitude,
      merchant.longitude
    );
    if (distKm > filterState.maxDistanceKm) return false;

    // Filter by Query (NLP tokens or exact match)
    if (filterState.query.trim()) {
      const qTokens = filterState.query.toLowerCase().trim().split(/\s+/);
      const targetString = `${p.name} ${p.normalizedName} ${p.category} ${p.tags.join(' ')} ${merchant.businessName}`.toLowerCase();
      const hasMatch = qTokens.some((token) => targetString.includes(token));
      if (!hasMatch) return false;
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const merchA = merchantMap.get(a.merchantId)!;
    const merchB = merchantMap.get(b.merchantId)!;

    if (filterState.sortBy === 'distance') {
      const distA = calculateDistanceKm(filterState.userLat, filterState.userLng, merchA.latitude, merchA.longitude);
      const distB = calculateDistanceKm(filterState.userLat, filterState.userLng, merchB.latitude, merchB.longitude);
      return distA - distB;
    }
    if (filterState.sortBy === 'trust_score') {
      return merchB.trustScore - merchA.trustScore;
    }
    if (filterState.sortBy === 'freshness') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (filterState.sortBy === 'price_asc') {
      return a.price - b.price;
    }
    if (filterState.sortBy === 'price_desc') {
      return b.price - a.price;
    }
    return 0;
  });

  const handleOpenReserve = (product: Product) => {
    const merchant = merchantMap.get(product.merchantId);
    if (merchant) {
      setSelectedProduct(product);
    }
  };

  const handleOpenRFQ = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleFindSubstitutes = (product: Product) => {
    setSubstituteTargetProduct(product);
  };

  const handleViewTrustCert = (merchant: Merchant, product?: Product) => {
    setTrustCertMerchant(merchant);
    setTrustCertProduct(product);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* Universal Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReservations={() => setShowReservationsModal(true)}
        onOpenStockoutModal={() => setShowStockoutModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onShowToast={addToast}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {activeTab === 'explore' && (
          <div className="space-y-8 pb-16">
            
            {/* Hero & NLP Search Bar */}
            <HeroSearch
              viewMode={viewMode}
              setViewMode={setViewMode}
              onOpenStockoutModal={() => setShowStockoutModal(true)}
            />

            {/* Content Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              
              {/* Radar View vs Grid View */}
              {viewMode === 'radar' ? (
                <InteractiveMapRadar
                  merchants={merchants}
                  products={products}
                  userLat={filterState.userLat}
                  userLng={filterState.userLng}
                  selectedCity={filterState.city}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                  onOpenReserve={handleOpenReserve}
                />
              ) : (
                <>
                  {/* Results Count & Current Filter Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {sortedProducts.length} Verified Stock Results Found
                      </span>
                      {filterState.query && (
                        <span className="text-xs text-slate-400">
                          for "<strong className="text-blue-400">{filterState.query}</strong>"
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Proximity: <strong>{filterState.city === 'All' ? 'All Nepal' : filterState.city} (≤ {filterState.maxDistanceKm}km)</strong></span>
                    </div>
                  </div>

                  {/* Product Cards Grid */}
                  {sortedProducts.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                        <PackageSearch className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-white">No Exact Stock Match in this Radius</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        We couldn't find active inventory matching your exact query within {filterState.maxDistanceKm} km. You can expand the radius or lodge a <strong>Stockout Wanted Request</strong> to alert local merchants immediately.
                      </p>
                      <button
                        onClick={() => setShowStockoutModal(true)}
                        className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
                      >
                        ✨ Broadcast Stockout Wanted Request
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {sortedProducts.map((product) => {
                        const merchant = merchantMap.get(product.merchantId)!;
                        return (
                          <ProductCard
                            key={product.id}
                            product={product}
                            merchant={merchant}
                            userLat={filterState.userLat}
                            userLng={filterState.userLng}
                            onSelectProduct={(p) => setSelectedProduct(p)}
                            onOpenReserve={handleOpenReserve}
                            onOpenRFQ={handleOpenRFQ}
                            onFindSubstitutes={handleFindSubstitutes}
                            onViewTrustCert={handleViewTrustCert}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        )}

        {/* Radar Tab Direct View */}
        {activeTab === 'radar' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <InteractiveMapRadar
              merchants={merchants}
              products={products}
              userLat={filterState.userLat}
              userLng={filterState.userLng}
              selectedCity={filterState.city}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onOpenReserve={handleOpenReserve}
            />
          </div>
        )}

        {/* Merchant Dashboard Tab */}
        {activeTab === 'merchant' && (
          <MerchantDashboard onShowToast={addToast} />
        )}

        {/* Admin Trust Guard Tab */}
        {activeTab === 'admin' && (
          <AdminVerificationDashboard onShowToast={addToast} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-bold text-slate-200">StockSpot Trust Platform</span>
            <span>• Hackathon Edition</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-cyan-400" /> SHA-256 Verified Ledger</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Supabase RLS Guarded</span>
            <span className="flex items-center gap-1"><HeartHandshake className="w-3.5 h-3.5 text-blue-400" /> Local Commerce & Trust</span>
          </div>
        </div>
      </footer>

      {/* Modals Container */}
      {selectedProduct && merchantMap.get(selectedProduct.merchantId) && (
        <ProductDetailModal
          product={selectedProduct}
          merchant={merchantMap.get(selectedProduct.merchantId)!}
          userLat={filterState.userLat}
          userLng={filterState.userLng}
          onClose={() => setSelectedProduct(null)}
          onFindSubstitutes={handleFindSubstitutes}
          onViewTrustCert={handleViewTrustCert}
          onShowToast={addToast}
        />
      )}

      {substituteTargetProduct && (
        <SubstituteFinderModal
          targetProduct={substituteTargetProduct}
          allProducts={products}
          merchants={merchants}
          userLat={filterState.userLat}
          userLng={filterState.userLng}
          onClose={() => setSubstituteTargetProduct(null)}
          onSelectSubstitute={(p) => setSelectedProduct(p)}
          onOpenReserve={handleOpenReserve}
        />
      )}

      {showStockoutModal && (
        <StockoutRequestModal
          onClose={() => setShowStockoutModal(false)}
          onShowToast={addToast}
        />
      )}

      {showReservationsModal && (
        <CustomerOrdersModal
          onClose={() => setShowReservationsModal(false)}
          onShowToast={addToast}
        />
      )}

      {trustCertMerchant && (
        <TrustCertificateModal
          merchant={trustCertMerchant}
          product={trustCertProduct}
          onClose={() => {
            setTrustCertMerchant(null);
            setTrustCertProduct(undefined);
          }}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onShowToast={addToast}
        />
      )}

      {/* Floating Toast Alerts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
};
