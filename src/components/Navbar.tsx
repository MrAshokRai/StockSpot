import React from 'react';
import { ShieldCheck, Store, User, Lock, RefreshCw, ShoppingBag, PlusCircle, Radio, Sparkles } from 'lucide-react';
import { store } from '../services/store';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: 'explore' | 'radar' | 'merchant' | 'admin';
  setActiveTab: (tab: 'explore' | 'radar' | 'merchant' | 'admin') => void;
  onOpenReservations: () => void;
  onOpenStockoutModal: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReservations,
  onOpenStockoutModal,
  onShowToast
}) => {
  const currentUser = store.getCurrentUser();
  const reservations = store.getReservations().filter(r => r.status === 'active');
  const merchants = store.getMerchants();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'customer' || value === 'admin') {
      store.switchRole(value as UserRole);
      setActiveTab(value === 'admin' ? 'admin' : 'explore');
      onShowToast(`Switched persona to ${value === 'admin' ? 'Platform Security Auditor' : 'Customer (Buyer)'}`, 'info');
    } else if (value.startsWith('merch_')) {
      store.switchRole('merchant', value);
      setActiveTab('merchant');
      const m = store.getMerchantById(value);
      onShowToast(`Switched persona to Merchant: ${m?.businessName}`, 'success');
    }
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset all demo stock, reservations, and demand data to initial pristine state?')) {
      store.resetToDemoDefaults();
      onShowToast('Database reset to initial demo seeds', 'info');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('explore')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B0F19]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">StockSpot</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Trust Radar
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Real-Time Local Inventory & Demand Discovery
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'explore'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Browse Stock
            </button>
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'radar'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Proximity Radar
            </button>
            <button
              onClick={() => {
                store.switchRole('merchant');
                setActiveTab('merchant');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'merchant'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-indigo-400" />
              Merchant Portal
            </button>
            <button
              onClick={() => {
                store.switchRole('admin');
                setActiveTab('admin');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'admin'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Admin Trust Guard
            </button>
          </nav>

          {/* Right Action Icons & Persona Switcher */}
          <div className="flex items-center gap-2">
            
            {/* Stockout Request trigger */}
            <button
              onClick={onOpenStockoutModal}
              title="Request missing stock / unmet demand"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Wanted Request</span>
            </button>

            {/* Active Reservations badge */}
            <button
              onClick={onOpenReservations}
              className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all"
              title="View my active reservations & pickup codes"
            >
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              {reservations.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold ring-2 ring-[#0B0F19]">
                  {reservations.length}
                </span>
              )}
            </button>

            {/* Persona Switcher Dropdown for Hackathon Demo */}
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
              <User className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
              <select
                value={
                  currentUser.role === 'customer'
                    ? 'customer'
                    : currentUser.role === 'admin'
                    ? 'admin'
                    : store.getActiveMerchantId()
                }
                onChange={handleRoleChange}
                className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer pr-1"
              >
                <optgroup label="Buyers / Consumers">
                  <option value="customer" className="bg-slate-900 text-slate-200">
                    🧑 Customer (Aayush)
                  </option>
                </optgroup>
                <optgroup label="Verified Local Merchants">
                  {merchants.map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                      🏪 {m.businessName.slice(0, 22)}...
                    </option>
                  ))}
                </optgroup>
                <optgroup label="System Governance">
                  <option value="admin" className="bg-slate-900 text-slate-200">
                    🛡️ Admin & Trust Auditor
                  </option>
                </optgroup>
              </select>
            </div>

            {/* Reset Demo Button */}
            <button
              onClick={handleResetDemo}
              title="Reset Demo Data"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
