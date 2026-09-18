import React from 'react';
import { Product, Merchant } from '../types';
import { calculateDistanceKm, formatDistance } from '../utils/geo';
import { formatCurrency, formatTimeAgo, getTrustLevel } from '../utils/formatters';
import { verifyStockFreshness } from '../services/aiEngine';
import { ShieldCheck, MapPin, Zap, Clock, PackageCheck, AlertTriangle, ArrowRight, Sparkles, Building2, Lock } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  merchant: Merchant;
  userLat: number;
  userLng: number;
  onSelectProduct: (product: Product) => void;
  onOpenReserve: (product: Product) => void;
  onOpenRFQ: (product: Product) => void;
  onFindSubstitutes: (product: Product) => void;
  onViewTrustCert: (merchant: Merchant, product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  merchant,
  userLat,
  userLng,
  onSelectProduct,
  onOpenReserve,
  onOpenRFQ,
  onFindSubstitutes,
  onViewTrustCert
}) => {
  const distanceKm = calculateDistanceKm(userLat, userLng, merchant.latitude, merchant.longitude);
  const trustLevel = getTrustLevel(merchant.trustScore);
  const freshness = verifyStockFreshness(product, merchant);

  const isOutOfStock = product.stockQuantity <= 0 || product.stockStatus === 'out_of_stock';
  const isLowStock = !isOutOfStock && (product.stockQuantity <= product.lowStockThreshold || product.stockStatus === 'low_stock');

  return (
    <div className={`group relative flex flex-col justify-between bg-slate-900/90 border rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:shadow-xl hover:shadow-blue-950/30 ${
      isOutOfStock
        ? 'border-rose-900/30 bg-rose-950/10'
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      
      {/* Top Header: Merchant info & Trust Score */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-xs text-slate-300 truncate group-hover:text-blue-400 transition-colors">
              {merchant.businessName}
            </span>
            {merchant.verificationStatus === 'verified' && (
              <span title="Identity & Business License Verified">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </span>
            )}
          </div>

          {/* Trust Score Badge */}
          <button
            onClick={() => onViewTrustCert(merchant, product)}
            className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border transition-transform hover:scale-105 ${trustLevel.bgClass} ${trustLevel.colorClass} ${trustLevel.borderClass}`}
            title="Click to view Cryptographic Trust Certificate"
          >
            <Lock className="w-3 h-3" />
            <span>{merchant.trustScore.toFixed(1)}%</span>
          </button>
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onSelectProduct(product)}
          className="font-bold text-base text-white tracking-tight leading-snug cursor-pointer hover:text-blue-400 transition-colors line-clamp-2"
        >
          {product.name}
        </h3>

        {/* Category & Freshness row */}
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-750 font-medium">
            {product.category}
          </span>
          
          {/* Freshness Timestamp */}
          <span
            className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-medium cursor-help"
            title={`Cryptographic Hash: ${product.freshnessHash}`}
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>{freshness.statusText}</span>
          </span>
        </div>

        {/* Product Description */}
        <p className="mt-2.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Distance & Branch location */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{merchant.city} • {formatDistance(distanceKm)}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono shrink-0">
            SKU: {product.sku.slice(0, 12)}
          </span>
        </div>
      </div>

      {/* Bottom Section: Stock Status, Price & CTA Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
        
        {/* Stock Meter & Price Bar */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-lg font-extrabold text-white tracking-tight">
              {formatCurrency(product.price)}
              <span className="text-xs font-normal text-slate-400 ml-1">/ {product.unit}</span>
            </div>
            
            {/* Wholesale Price tier if available */}
            {product.wholesalePrice && (
              <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>Bulk: {formatCurrency(product.wholesalePrice)} (MOQ: {product.moq})</span>
              </div>
            )}
          </div>

          {/* Stock Availability Pill */}
          <div className="text-right">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Out of Stock</span>
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>{product.stockQuantity} {product.unit} left</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                <PackageCheck className="w-3.5 h-3.5" />
                <span>{product.stockQuantity} {product.unit}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {isOutOfStock ? (
            <>
              <button
                onClick={() => onFindSubstitutes(product)}
                className="col-span-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Substitute Finder</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onOpenReserve(product)}
                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-blue-600/20 transition-all"
              >
                <span>Reserve Stock</span>
              </button>

              {product.wholesalePrice ? (
                <button
                  onClick={() => onOpenRFQ(product)}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700 transition-all"
                >
                  <span>B2B RFQ</span>
                </button>
              ) : (
                <button
                  onClick={() => onSelectProduct(product)}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700 transition-all"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>

      </div>

    </div>
  );
};
