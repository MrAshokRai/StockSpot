import React, { useState } from 'react';
import { Merchant, Product } from '../types';
import { calculateDistanceKm, formatDistance, KNOWN_CITIES } from '../utils/geo';
import { getTrustLevel, formatCurrency } from '../utils/formatters';
import { Radio, MapPin, ShieldCheck, Store, ArrowRight, PackageCheck, Zap, Navigation } from 'lucide-react';

interface InteractiveMapRadarProps {
  merchants: Merchant[];
  products: Product[];
  userLat: number;
  userLng: number;
  selectedCity: string;
  onSelectProduct: (product: Product) => void;
  onOpenReserve: (product: Product) => void;
}

export const InteractiveMapRadar: React.FC<InteractiveMapRadarProps> = ({
  merchants,
  products,
  userLat,
  userLng,
  selectedCity,
  onSelectProduct,
  onOpenReserve
}) => {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(merchants[0]?.id || '');
  const [activeRadiusKm, setActiveRadiusKm] = useState<number>(25);

  const selectedMerchant = merchants.find(m => m.id === selectedMerchantId) || merchants[0];
  const merchantProducts = products.filter(p => p.merchantId === selectedMerchant?.id && p.isActive);

  // Compute map coordinates relative to center
  const centerLat = userLat;
  const centerLng = userLng;

  // Radar scale factor
  const getCanvasCoords = (lat: number, lng: number) => {
    // 1 deg lat ~= 111km, 1 deg lng ~= 96km in Nepal
    const deltaLatKm = (lat - centerLat) * 111;
    const deltaLngKm = (lng - centerLng) * 96;

    // Scale to radar svg coordinate system (Center at 250, 250 with radius 200 representing activeRadiusKm)
    const scale = 180 / Math.max(activeRadiusKm, 5);
    const x = 250 + deltaLngKm * scale;
    const y = 250 - deltaLatKm * scale;

    return {
      x: Math.max(30, Math.min(470, x)),
      y: Math.max(30, Math.min(470, y)),
      distanceKm: calculateDistanceKm(centerLat, centerLng, lat, lng)
    };
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Geo-Inventory Radar & Proximity Map
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Pulse
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Center: <strong className="text-slate-200">{selectedCity === 'All' ? 'Kathmandu Valley' : selectedCity}</strong> (Lat: {userLat.toFixed(4)}, Lng: {userLng.toFixed(4)})
            </p>
          </div>
        </div>

        {/* Radius selector */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          {[5, 15, 25, 50].map((radius) => (
            <button
              key={radius}
              onClick={() => setActiveRadiusKm(radius)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeRadiusKm === radius
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {radius} km
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Radar Canvas + Merchant Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        
        {/* Radar SVG Visualizer */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#070A12] border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden">
          
          {/* Radar Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)] pointer-events-none" />

          <svg viewBox="0 0 500 500" className="w-full max-w-[440px] aspect-square select-none">
            
            {/* Concentric distance rings */}
            <circle cx="250" cy="250" r="190" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="250" cy="250" r="140" fill="none" stroke="#1e293b" strokeWidth="1" />
            <circle cx="250" cy="250" r="90" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="250" cy="250" r="40" fill="none" stroke="#334155" strokeWidth="1" />

            {/* Radar Crosshairs */}
            <line x1="250" y1="20" x2="250" y2="480" stroke="#1e293b" strokeWidth="1" />
            <line x1="20" y1="250" x2="480" y2="250" stroke="#1e293b" strokeWidth="1" />

            {/* Range Labels */}
            <text x="254" y="115" fill="#64748b" fontSize="10" fontFamily="monospace">{Math.round(activeRadiusKm * 0.7)}km</text>
            <text x="254" y="65" fill="#64748b" fontSize="10" fontFamily="monospace">{activeRadiusKm}km</text>

            {/* Radar Sweep Animation Line */}
            <g className="origin-[250px_250px] animate-radar-sweep opacity-40">
              <line x1="250" y1="250" x2="250" y2="50" stroke="#06b6d4" strokeWidth="2" />
              <polygon points="250,250 250,50 320,80" fill="url(#radarGradient)" />
            </g>

            {/* Gradients */}
            <defs>
              <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* User Center Node */}
            <circle cx="250" cy="250" r="7" fill="#3b82f6" className="animate-pulse" />
            <circle cx="250" cy="250" r="14" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.8" />
            <text x="250" y="275" fill="#93c5fd" fontSize="11" fontWeight="bold" textAnchor="middle">
              You (GPS)
            </text>

            {/* Merchant Nodes on Radar */}
            {merchants.map((merchant) => {
              const coords = getCanvasCoords(merchant.latitude, merchant.longitude);
              const isSelected = merchant.id === selectedMerchantId;
              const trustLevel = getTrustLevel(merchant.trustScore);
              const isVerified = merchant.verificationStatus === 'verified';

              return (
                <g
                  key={merchant.id}
                  onClick={() => setSelectedMerchantId(merchant.id)}
                  className="cursor-pointer group"
                >
                  {/* Outer ripple when selected */}
                  {isSelected && (
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r="18"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      className="animate-ping opacity-75"
                    />
                  )}

                  {/* Pin Circle */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={isSelected ? 9 : 7}
                    fill={isVerified ? '#10b981' : '#f59e0b'}
                    stroke={isSelected ? '#ffffff' : '#0f172a'}
                    strokeWidth="2"
                  />

                  {/* Label */}
                  <text
                    x={coords.x}
                    y={coords.y - 12}
                    fill={isSelected ? '#ffffff' : '#cbd5e1'}
                    fontSize={isSelected ? '11' : '10'}
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    textAnchor="middle"
                    className="drop-shadow-md pointer-events-none"
                  >
                    {merchant.businessName.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Radar Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-400/30" />
              <span>Current Position</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Verified Store (KYC Certified)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Pending Review</span>
            </div>
          </div>
        </div>

        {/* Right Selected Store & Real-Time Stock Feed */}
        <div className="lg:col-span-5 space-y-4">
          
          {selectedMerchant ? (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              
              {/* Store Identity & Trust Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white tracking-tight">
                      {selectedMerchant.businessName}
                    </h3>
                    {selectedMerchant.verificationStatus === 'verified' && (
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>{selectedMerchant.address}, {selectedMerchant.city}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    🛡️ {selectedMerchant.trustScore.toFixed(1)}% Trust
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    📍 {formatDistance(calculateDistanceKm(centerLat, centerLng, selectedMerchant.latitude, selectedMerchant.longitude))} away
                  </div>
                </div>
              </div>

              {/* Multi-Branch Selector */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Available Branches ({selectedMerchant.branches.length})
                </span>
                <div className="space-y-1.5">
                  {selectedMerchant.branches.map(branch => (
                    <div
                      key={branch.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-white">{branch.branchName}</span>
                        <span className="text-[11px] text-slate-400 block">{branch.operatingHours}</span>
                      </div>
                      <a
                        href={`tel:${branch.phone}`}
                        className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-[11px] font-bold shrink-0"
                      >
                        {branch.phone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live In-Store Products List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Verified Stock on Hand ({merchantProducts.length})
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <Zap className="w-3 h-3" /> Real-Time Sync
                  </span>
                </div>

                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {merchantProducts.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No active products listed currently.
                    </div>
                  ) : (
                    merchantProducts.map(prod => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <h4 className="font-bold text-white truncate">{prod.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span className="text-emerald-400 font-bold">{formatCurrency(prod.price)}</span>
                            <span>•</span>
                            <span className={prod.stockQuantity > 0 ? 'text-slate-300' : 'text-rose-400 font-bold'}>
                              {prod.stockQuantity > 0 ? `${prod.stockQuantity} ${prod.unit}` : 'Out of Stock'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {prod.stockQuantity > 0 ? (
                            <button
                              onClick={() => onOpenReserve(prod)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-sm transition-all"
                            >
                              Reserve
                            </button>
                          ) : (
                            <button
                              onClick={() => onSelectProduct(prod)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-semibold text-[11px]"
                            >
                              Substitutes
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              Select a store on the radar to view live verified stock.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
