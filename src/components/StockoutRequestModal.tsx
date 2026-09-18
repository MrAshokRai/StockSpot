import React, { useState } from 'react';
import { store } from '../services/store';
import { KNOWN_CITIES } from '../utils/geo';
import { X, Sparkles, Send, MapPin, Radio, PackagePlus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StockoutRequestModalProps {
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const StockoutRequestModal: React.FC<StockoutRequestModalProps> = ({
  onClose,
  onShowToast
}) => {
  const categories = store.getCategories();
  const filterState = store.getFilterState();

  const [queryText, setQueryText] = useState(filterState.query || '');
  const [category, setCategory] = useState(categories[0]?.name || 'Hardware & Construction');
  const [targetQuantity, setTargetQuantity] = useState<number>(10);
  const [locationCity, setLocationCity] = useState(filterState.city !== 'All' ? filterState.city : 'Kathmandu');
  const [customerName, setCustomerName] = useState('Aayush Adhikari');
  const [customerContact, setCustomerContact] = useState('+977-9841234567');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) {
      onShowToast('Please enter the required product details', 'warning');
      return;
    }

    try {
      store.submitStockoutRequest({
        queryText,
        category,
        targetQuantity,
        locationCity,
        customerName,
        customerContact,
        notes
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      onShowToast('Wanted Request Broadcasted! Local merchants have received this demand signal.', 'success');
      onClose();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to submit request', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Lodge Stockout Wanted Request
              </h2>
              <p className="text-xs text-slate-400">
                Can't find what you need? Broadcast demand directly to regional suppliers.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Required Item / Material Name & Specs
            </label>
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="e.g. 80 bags Pozzolana Cement, 10 packs N95 Respirators..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Quantity</label>
              <input
                type="number"
                min="1"
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location / City</label>
              <select
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              >
                {Object.keys(KNOWN_CITIES).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Urgency / Special Note</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Need on construction site by Thursday morning"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-400 shrink-0" />
            <span>This request will be instantly converted to a demand heat signal on local merchant restocking portals.</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Broadcast Demand Signal</span>
          </button>
        </form>

      </div>
    </div>
  );
};
