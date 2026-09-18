import React, { useState } from 'react';
import { Product, Merchant } from '../types';
import { calculateDistanceKm, formatDistance } from '../utils/geo';
import { formatCurrency, getTrustLevel } from '../utils/formatters';
import { verifyStockFreshness, findSmartSubstitutes } from '../services/aiEngine';
import { store } from '../services/store';
import {
  X,
  ShieldCheck,
  MapPin,
  Zap,
  PackageCheck,
  AlertTriangle,
  Building2,
  Lock,
  Clock,
  Sparkles,
  CheckCircle2,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProductDetailModalProps {
  product: Product;
  merchant: Merchant;
  userLat: number;
  userLng: number;
  onClose: () => void;
  onFindSubstitutes: (product: Product) => void;
  onViewTrustCert: (merchant: Merchant, product: Product) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  merchant,
  userLat,
  userLng,
  onClose,
  onFindSubstitutes,
  onViewTrustCert,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'reserve' | 'rfq'>('details');
  const [reserveQty, setReserveQty] = useState<number>(1);
  const [customerName, setCustomerName] = useState('Aayush Adhikari');
  const [customerPhone, setCustomerPhone] = useState('+977-9841234567');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // RFQ state
  const [rfqQty, setRfqQty] = useState<number>(product.moq || 10);
  const [rfqTargetPrice, setRfqTargetPrice] = useState<number>(product.wholesalePrice || product.price * 0.9);
  const [rfqMessage, setRfqMessage] = useState('Looking for wholesale delivery with batch test certificate.');

  const distanceKm = calculateDistanceKm(userLat, userLng, merchant.latitude, merchant.longitude);
  const trustLevel = getTrustLevel(merchant.trustScore);
  const freshness = verifyStockFreshness(product, merchant);

  const isOutOfStock = product.stockQuantity <= 0;

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = store.createReservation({
        productId: product.id,
        quantity: reserveQty,
        customerName,
        customerPhone,
        fulfillmentType,
        deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
        notes
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onShowToast(`Stock Reserved! Your Pickup Code is ${res.pickupCode}`, 'success');
      onClose();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create reservation', 'error');
    }
  };

  const handleCreateRFQ = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.submitRFQ({
        productId: product.id,
        requestedQuantity: rfqQty,
        targetPrice: rfqTargetPrice,
        message: rfqMessage,
        customerName,
        customerEmail: 'customer@stockspot.np',
        customerPhone
      });

      onShowToast('Wholesale RFQ Inquiry submitted to merchant successfully!', 'success');
      onClose();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to submit RFQ', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <PackageCheck className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <span className="text-xs text-slate-400 font-medium block truncate">
                {merchant.businessName} • {merchant.city}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
                {product.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b border-slate-800 px-5 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Product & Trust Details
          </button>
          {!isOutOfStock && (
            <>
              <button
                onClick={() => setActiveTab('reserve')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'reserve'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Instant Reserve (Hold)
              </button>
              {product.wholesalePrice && (
                <button
                  onClick={() => setActiveTab('rfq')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'rfq'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  B2B Wholesale RFQ
                </button>
              )}
            </>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {activeTab === 'details' && (
            <>
              {/* Key Pricing & Stock highlight */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block font-medium">Standard Price</span>
                  <span className="text-lg font-extrabold text-white">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">per {product.unit}</span>
                </div>

                {product.wholesalePrice && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[11px] text-amber-400 block font-medium">Wholesale Tier</span>
                    <span className="text-lg font-extrabold text-amber-300">
                      {formatCurrency(product.wholesalePrice)}
                    </span>
                    <span className="text-[10px] text-amber-400/80 block">MOQ: {product.moq} {product.unit}</span>
                  </div>
                )}

                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block font-medium">Real-Time Stock</span>
                  <span className={`text-lg font-extrabold ${product.stockQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {product.stockQuantity} {product.unit}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{product.stockStatus}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block font-medium">Distance</span>
                  <span className="text-lg font-extrabold text-blue-400">
                    {formatDistance(distanceKm)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{merchant.city}</span>
                </div>
              </div>

              {/* Product Full Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800">
                  {product.description}
                </p>
              </div>

              {/* Technical Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Technical Specifications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="flex justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 text-xs">
                        <span className="text-slate-400">{key}:</span>
                        <span className="font-semibold text-white">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cryptographic Trust & Freshness Proof */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/30 to-indigo-950/30 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-xs text-white">Cryptographic Proof-of-Freshness</span>
                  </div>
                  <button
                    onClick={() => onViewTrustCert(merchant, product)}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 underline"
                  >
                    View Trust Certificate →
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Merchant Trust Rating:</span>
                    <span className="font-bold text-emerald-400">{merchant.trustScore.toFixed(1)}% ({trustLevel.label})</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Freshness Integrity:</span>
                    <span className="font-bold text-cyan-400">{freshness.statusText}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] pt-1 text-slate-400 border-t border-slate-800">
                    <span>Tamper-evident Hash:</span>
                    <span className="text-blue-300 truncate max-w-[220px]">{product.freshnessHash}</span>
                  </div>
                </div>
              </div>

              {/* Out of Stock Call to action */}
              {isOutOfStock && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
                  <p className="text-xs text-rose-300 font-semibold">
                    This item is currently out of stock at this location.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onFindSubstitutes(product);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition-all"
                  >
                    ✨ Run AI Substitute Matcher Now
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'reserve' && (
            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                🔒 <strong>Anti-Ghost Stock Lock:</strong> Reserving holds real inventory for <strong>4 hours</strong> with an encrypted pickup code. No upfront payment required.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reservation Quantity ({product.unit})</label>
                  <input
                    type="number"
                    min="1"
                    max={product.stockQuantity}
                    value={reserveQty}
                    onChange={(e) => setReserveQty(Math.max(1, Math.min(product.stockQuantity, Number(e.target.value))))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Max available: {product.stockQuantity} {product.unit}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fulfillment Mode</label>
                  <select
                    value={fulfillmentType}
                    onChange={(e) => setFulfillmentType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="pickup">Self-Pickup at Store</option>
                    <option value="delivery">Merchant Local Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {fulfillmentType === 'delivery' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Delivery Address & Landmark</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. Ward 4, Kumaripati near Bank"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Special Instructions / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Will arrive around 4 PM with truck"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              {/* Pricing breakdown */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 block">Total Hold Value</span>
                  <span className="text-xs text-slate-500">
                    {reserveQty} x {formatCurrency(reserveQty >= product.moq && product.wholesalePrice ? product.wholesalePrice : product.price)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-white">
                    {formatCurrency((reserveQty >= product.moq && product.wholesalePrice ? product.wholesalePrice : product.price) * reserveQty)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all"
              >
                Confirm Reservation & Generate Pickup Code
              </button>
            </form>
          )}

          {activeTab === 'rfq' && (
            <form onSubmit={handleCreateRFQ} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                🏢 <strong>B2B Wholesale Request for Quote:</strong> Directly negotiate bulk pricing with verified supplier.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Requested Quantity ({product.unit})</label>
                  <input
                    type="number"
                    min={product.moq || 1}
                    value={rfqQty}
                    onChange={(e) => setRfqQty(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    required
                  />
                  <span className="text-[11px] text-amber-400/80 mt-1 block">MOQ: {product.moq} {product.unit}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Price per {product.unit} (Rs.)</label>
                  <input
                    type="number"
                    value={rfqTargetPrice}
                    onChange={(e) => setRfqTargetPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message & Requirements</label>
                <textarea
                  rows={3}
                  value={rfqMessage}
                  onChange={(e) => setRfqMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm shadow-xl transition-all"
              >
                Send Wholesale RFQ Inquiry
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
