import React from 'react';
import { store } from '../services/store';
import { formatCurrency, formatTimeAgo } from '../utils/formatters';
import { X, QrCode, ShoppingBag, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface CustomerOrdersModalProps {
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  onClose,
  onShowToast
}) => {
  const reservations = store.getReservations();

  const handleCancel = (resId: string) => {
    if (window.confirm('Are you sure you want to cancel this reservation hold and release stock back to the store?')) {
      store.cancelReservation(resId, 'Cancelled by customer');
      onShowToast('Reservation cancelled. Stock released.', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                My Active Reservations & Pickup Codes
              </h2>
              <p className="text-xs text-slate-400">
                Present your unique Pickup Code at the merchant store counter to collect verified stock.
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {reservations.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-400">You have no active reservations yet.</p>
              <p className="text-xs text-slate-500">Browse stock and click "Reserve Stock" to hold items for 4 hours.</p>
            </div>
          ) : (
            reservations.map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      res.status === 'active'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : res.status === 'fulfilled'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {res.status.toUpperCase()} HOLD
                    </span>
                    <h3 className="font-bold text-white text-base mt-1">{res.productName}</h3>
                    <p className="text-xs text-slate-400">
                      Store: <strong className="text-slate-200">{res.merchantName}</strong> ({res.branchName || 'Main Yard'})
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-extrabold text-white block">
                      {formatCurrency(res.totalPrice)}
                    </span>
                    <span className="text-xs text-slate-400">Qty: {res.quantity}</span>
                  </div>
                </div>

                {/* Pickup Code Display */}
                {res.status === 'active' && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-6 h-6 text-cyan-400 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Counter Pickup Code
                        </span>
                        <span className="font-mono text-lg font-black text-cyan-300 tracking-wider">
                          {res.pickupCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Expires {formatTimeAgo(res.expiresAt)}
                      </span>
                      <button
                        onClick={() => handleCancel(res.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold"
                      >
                        Cancel Hold
                      </button>
                    </div>
                  </div>
                )}

                {res.status === 'fulfilled' && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Order successfully verified and picked up at store counter.</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
