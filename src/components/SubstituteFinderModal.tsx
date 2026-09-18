import React from 'react';
import { Product, Merchant, SubstituteRecommendation } from '../types';
import { findSmartSubstitutes } from '../services/aiEngine';
import { formatCurrency } from '../utils/formatters';
import { calculateDistanceKm, formatDistance } from '../utils/geo';
import { X, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, MapPin, PackageCheck, AlertCircle } from 'lucide-react';

interface SubstituteFinderModalProps {
  targetProduct: Product;
  allProducts: Product[];
  merchants: Merchant[];
  userLat: number;
  userLng: number;
  onClose: () => void;
  onSelectSubstitute: (product: Product) => void;
  onOpenReserve: (product: Product) => void;
}

export const SubstituteFinderModal: React.FC<SubstituteFinderModalProps> = ({
  targetProduct,
  allProducts,
  merchants,
  userLat,
  userLng,
  onClose,
  onSelectSubstitute,
  onOpenReserve
}) => {
  const substitutes: SubstituteRecommendation[] = findSmartSubstitutes(
    targetProduct,
    allProducts,
    merchants,
    userLat,
    userLng
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                AI Stockout Substitute & Alternative Radar
              </h2>
              <p className="text-xs text-slate-400">
                Found compatible in-stock alternatives for <strong className="text-slate-200">{targetProduct.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Item Reference Banner */}
        <div className="p-4 bg-rose-950/20 border-b border-rose-900/30 flex items-center justify-between text-xs">
          <div>
            <span className="text-[11px] text-rose-400 font-bold block uppercase tracking-wider">Unsatisfied / Out of Stock Item</span>
            <span className="font-bold text-white text-sm">{targetProduct.name}</span>
            <span className="text-slate-400 block">{formatCurrency(targetProduct.price)} / {targetProduct.unit} • {targetProduct.category}</span>
          </div>
          <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
            0 Stock
          </span>
        </div>

        {/* Alternatives List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {substitutes.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-400">No close alternatives in this exact category found nearby.</p>
              <p className="text-xs text-slate-500">You can lodge a "Stockout Wanted Request" to broadcast this demand to regional distributors.</p>
            </div>
          ) : (
            substitutes.map((item, idx) => (
              <div
                key={item.product.id}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-blue-500/50 transition-all space-y-3"
              >
                {/* Match Score & Merchant */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {item.matchScore}% Match
                      </span>
                      <span className="font-semibold text-xs text-slate-300">{item.merchant.businessName}</span>
                      {item.merchant.verificationStatus === 'verified' && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base mt-1">
                      {item.product.name}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-white block">
                      {formatCurrency(item.product.price)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.priceDifference > 0 ? `+${formatCurrency(item.priceDifference)}` : item.priceDifference < 0 ? `-${formatCurrency(Math.abs(item.priceDifference))}` : 'Same price'}
                    </span>
                  </div>
                </div>

                {/* Match Explanation */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{item.matchReason}</span>
                </div>

                {/* Stock & Distance footer with CTA */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-750 text-xs">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <PackageCheck className="w-3.5 h-3.5" />
                      {item.product.stockQuantity} {item.product.unit} Available
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {item.merchant.city} • {item.distanceKm} km
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectSubstitute(item.product);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      View Specs
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenReserve(item.product);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all"
                    >
                      Reserve Substitute
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
