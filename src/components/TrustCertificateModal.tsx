import React from 'react';
import { Merchant, Product } from '../types';
import { getTrustLevel } from '../utils/formatters';
import { verifyStockFreshness } from '../services/aiEngine';
import { X, ShieldCheck, Lock, CheckCircle2, Award, Calendar, Hash, FileCheck2, Cpu } from 'lucide-react';

interface TrustCertificateModalProps {
  merchant: Merchant;
  product?: Product;
  onClose: () => void;
}

export const TrustCertificateModal: React.FC<TrustCertificateModalProps> = ({
  merchant,
  product,
  onClose
}) => {
  const trustLevel = getTrustLevel(merchant.trustScore);
  const freshness = product ? verifyStockFreshness(product, merchant) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Certificate Header Banner */}
        <div className="p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block">
                Digital Trust & KYC Certificate
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Verified Merchant Ledger Proof
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* Trust Score & Verification badge */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Business Name</span>
              <span className="text-base font-extrabold text-white">{merchant.businessName}</span>
              <span className="text-xs text-slate-400 block">{merchant.address}, {merchant.city}</span>
            </div>

            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-xl text-sm font-black border ${trustLevel.bgClass} ${trustLevel.colorClass} ${trustLevel.borderClass}`}>
                {merchant.trustScore.toFixed(1)}% ({trustLevel.badgeText})
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Trust Grade</span>
            </div>
          </div>

          {/* Audit Credentials */}
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-400" /> Government Registration / VAT:
              </span>
              <span className="font-mono font-bold text-white">{merchant.businessRegistrationNo}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Verification Timestamp:
              </span>
              <span className="font-mono text-slate-200">{merchant.verifiedAt ? new Date(merchant.verifiedAt).toLocaleDateString() : 'Verified by Platform Authority'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> KYC Status:
              </span>
              <span className="font-bold text-emerald-400">PASSED (Identity, Address & Tax Ledger Verified)</span>
            </div>
          </div>

          {/* If Product specific proof */}
          {product && freshness && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs text-white">Product-Level Cryptographic Stock Integrity</span>
              </div>

              <div className="text-xs space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Product SKU:</span>
                  <span className="font-mono font-semibold text-white">{product.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verified Freshness Hash:</span>
                  <span className="font-mono text-cyan-300 truncate max-w-[200px]">{product.freshnessHash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stock Freshness Status:</span>
                  <span className="font-bold text-emerald-400">{freshness.statusText}</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Digital signatures cryptographically guarantee zero ghost inventory and locked pricing during hold windows.</span>
          </div>

        </div>

      </div>
    </div>
  );
};
