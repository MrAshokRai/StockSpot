import React, { useState, useEffect } from 'react';
import { Search, MapPin, SlidersHorizontal, Sparkles, CheckCircle2, ShieldCheck, Zap, Radio, LayoutGrid } from 'lucide-react';
import { store } from '../services/store';
import { KNOWN_CITIES } from '../utils/geo';
import { parseNaturalLanguageSearch } from '../services/aiEngine';
import { AIIntentResult } from '../types';

interface HeroSearchProps {
  viewMode: 'grid' | 'radar';
  setViewMode: (mode: 'grid' | 'radar') => void;
  onOpenStockoutModal: () => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  viewMode,
  setViewMode,
  onOpenStockoutModal
}) => {
  const filterState = store.getFilterState();
  const categories = store.getCategories();
  const [localQuery, setLocalQuery] = useState(filterState.query);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiIntent, setAiIntent] = useState<AIIntentResult | null>(null);

  useEffect(() => {
    if (localQuery.trim().length >= 2) {
      const intent = parseNaturalLanguageSearch(localQuery);
      setAiIntent(intent);
    } else {
      setAiIntent(null);
    }
  }, [localQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.setFilterState({ query: localQuery });
  };

  const handleCategorySelect = (catName: string) => {
    store.setFilterState({ category: catName });
  };

  const handleCityChange = (city: string) => {
    if (city === 'All') {
      store.setFilterState({ city: 'All' });
    } else if (KNOWN_CITIES[city]) {
      const coords = KNOWN_CITIES[city];
      store.setFilterState({
        city,
        userLat: coords.latitude,
        userLng: coords.longitude
      });
    }
  };

  const quickPills = [
    { label: '50 bags 53 Grade Cement', query: '50 bags 53 grade cement' },
    { label: 'Paracetamol 500mg IP', query: 'paracetamol 500mg' },
    { label: 'ESP32 Wi-Fi Board', query: 'esp32 dev board' },
    { label: 'Jumla Organic Apples', query: 'jumla organic apple' },
    { label: 'Basmati Rice 25kg', query: 'basmati rice 25kg' },
    { label: '3M N95 Respirators', query: '3m n95 mask' }
  ];

  return (
    <div className="relative pt-6 pb-4 border-b border-slate-800/80 bg-gradient-to-b from-[#0B0F19] via-[#0e1424] to-[#0B0F19]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner Slogan */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Verified Local Inventory Radar</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Find Stock in Real-Time. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">Zero Ghost Inventory.</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400">
            Search physical store inventory, verified freshness, digital trust score & B2B wholesale tiers across verified local merchants.
          </p>
        </div>

        {/* Search Bar Container */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 shadow-2xl shadow-blue-950/40 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              
              {/* Search icon & Input */}
              <div className="flex items-center flex-1 px-3 py-1.5">
                <Search className="w-5 h-5 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => {
                    setLocalQuery(e.target.value);
                    store.setFilterState({ query: e.target.value });
                  }}
                  placeholder="e.g. 50 bags OPC cement near Lalitpur, surgical mask box 50, esp32..."
                  className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* City selector inside search bar */}
              <div className="flex items-center border-t sm:border-t-0 sm:border-l border-slate-800 px-3 py-1.5 gap-2 shrink-0">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <select
                  value={filterState.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-medium text-slate-200 outline-none cursor-pointer pr-2"
                >
                  <option value="All" className="bg-slate-900 text-white">All Regions (Nepal)</option>
                  {Object.keys(KNOWN_CITIES).map(city => (
                    <option key={city} value={city} className="bg-slate-900 text-white">
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    showAdvanced
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle advanced filters"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
                >
                  Discover
                </button>
              </div>
            </div>
          </form>

          {/* AI Query Intent Preview Badge */}
          {aiIntent && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="flex items-center gap-1 font-semibold text-cyan-400">
                <Zap className="w-3.5 h-3.5" /> AI Intent Detected:
              </span>
              <span className="text-slate-300">
                Product: <strong className="text-white font-medium">"{aiIntent.extractedProduct}"</strong>
              </span>
              {aiIntent.extractedQuantity && (
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Target Qty: {aiIntent.extractedQuantity}
                </span>
              )}
              {aiIntent.isUrgent && (
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                  🚨 Urgent Priority
                </span>
              )}
              {aiIntent.isWholesale && (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  🏢 B2B / Wholesale
                </span>
              )}
              {aiIntent.extractedCategory && (
                <span className="text-slate-400">
                  Category: <span className="text-slate-200">{aiIntent.extractedCategory}</span>
                </span>
              )}
            </div>
          )}

          {/* Quick Query Suggestions */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-slate-500 shrink-0 font-medium">Popular:</span>
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setLocalQuery(pill.query);
                  store.setFilterState({ query: pill.query });
                }}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Advanced Filter Panel */}
          {showAdvanced && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Distance Radius */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                    <span>Radius Limit</span>
                    <span className="text-blue-400 font-bold">{filterState.maxDistanceKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="100"
                    step="2"
                    value={filterState.maxDistanceKm}
                    onChange={(e) => store.setFilterState({ maxDistanceKm: Number(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>2 km</span>
                    <span>25 km</span>
                    <span>100 km</span>
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Sort Results</label>
                  <select
                    value={filterState.sortBy}
                    onChange={(e) => store.setFilterState({ sortBy: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="distance">📍 Distance (Closest First)</option>
                    <option value="trust_score">🛡️ Digital Trust Score (Highest)</option>
                    <option value="freshness">⚡ Stock Freshness (Most Recent)</option>
                    <option value="price_asc">💰 Price (Low to High)</option>
                    <option value="price_desc">💰 Price (High to Low)</option>
                  </select>
                </div>

                {/* Verification & Stock Checkboxes */}
                <div className="space-y-2 flex flex-col justify-center">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterState.inStockOnly}
                      onChange={(e) => store.setFilterState({ inStockOnly: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Hide Out-of-Stock Items</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterState.verifiedOnly}
                      onChange={(e) => store.setFilterState({ verifiedOnly: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Verified Merchants Only (KYC Pass)</span>
                  </label>
                </div>

              </div>
            </div>
          )}

          {/* Category Chips Bar & View Mode Toggle */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2">
            
            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => handleCategorySelect('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  filterState.category === 'All'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    filterState.category === cat.name
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* View Mode Toggle: Grid vs Radar */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('radar')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  viewMode === 'radar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Radar Map</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
