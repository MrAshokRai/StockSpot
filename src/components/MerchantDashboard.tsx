import React, { useState } from 'react';
import { store } from '../services/store';
import { Product, Merchant, MerchantBranch, DemandSignal } from '../types';
import { formatCurrency, formatTimeAgo, getTrustLevel } from '../utils/formatters';
import { verifyStockFreshness, analyzeDemandGaps } from '../services/aiEngine';
import {
  Store,
  Plus,
  FileSpreadsheet,
  Upload,
  Download,
  Zap,
  TrendingUp,
  PackageCheck,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Trash2,
  Edit3,
  Search,
  Lock,
  Sparkles,
  QrCode
} from 'lucide-react';

interface MerchantDashboardProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ onShowToast }) => {
  const merchants = store.getMerchants();
  const activeMerchantId = store.getActiveMerchantId();
  const activeBranchId = store.getActiveBranchId();
  const activeMerchant = store.getMerchantById(activeMerchantId) || merchants[0];

  const allProducts = store.getProducts();
  const merchantProducts = allProducts.filter(p => p.merchantId === activeMerchant?.id);
  const reservations = store.getReservations().filter(r => r.merchantId === activeMerchant?.id);
  const rfqs = store.getRFQs().filter(r => r.merchantId === activeMerchant?.id);
  const demandSignals = store.getDemandSignals();
  const demandAnalysis = analyzeDemandGaps(demandSignals, activeMerchant?.category);

  // Tabs
  const [activeTab, setActiveTab] = useState<'inventory' | 'demand' | 'reservations' | 'rfqs' | 'import'>('inventory');

  // New / Edit Product Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    category: activeMerchant?.category || 'Hardware & Construction',
    sku: '',
    price: 100,
    wholesalePrice: 90,
    moq: 1,
    unit: 'pcs',
    stockQuantity: 50,
    lowStockThreshold: 5,
    description: ''
  });

  // Pickup Verification Input
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [selectedResId, setSelectedResId] = useState<string | null>(null);

  // RFQ response state
  const [respondingRfqId, setRespondingRfqId] = useState<string | null>(null);
  const [rfqQuotePrice, setRfqQuotePrice] = useState<number>(0);
  const [rfqResponseMsg, setRfqResponseMsg] = useState('');

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState('');

  const handleOpenAddModal = (prefillName?: string, prefillCat?: string) => {
    setEditingProductId(null);
    setProdForm({
      name: prefillName || '',
      category: prefillCat || activeMerchant?.category || 'Hardware & Construction',
      sku: `SKU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      price: 500,
      wholesalePrice: 450,
      moq: 5,
      unit: 'pcs',
      stockQuantity: 100,
      lowStockThreshold: 10,
      description: prefillName ? `Fresh stock batch for ${prefillName}` : ''
    });
    setShowProductModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProductId(p.id);
    setProdForm({
      name: p.name,
      category: p.category,
      sku: p.sku,
      price: p.price,
      wholesalePrice: p.wholesalePrice || p.price * 0.9,
      moq: p.moq || 1,
      unit: p.unit,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      description: p.description
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        store.updateProduct(editingProductId, {
          name: prodForm.name,
          category: prodForm.category,
          sku: prodForm.sku,
          price: Number(prodForm.price),
          wholesalePrice: prodForm.wholesalePrice ? Number(prodForm.wholesalePrice) : undefined,
          moq: Number(prodForm.moq),
          unit: prodForm.unit,
          stockQuantity: Number(prodForm.stockQuantity),
          lowStockThreshold: Number(prodForm.lowStockThreshold),
          description: prodForm.description
        });
        onShowToast('Product updated & stock freshness re-verified!', 'success');
      } else {
        store.addProduct({
          merchantId: activeMerchant.id,
          branchId: activeBranchId || activeMerchant.branches[0]?.id,
          name: prodForm.name,
          normalizedName: prodForm.name.toLowerCase().trim(),
          category: prodForm.category,
          sku: prodForm.sku,
          price: Number(prodForm.price),
          wholesalePrice: prodForm.wholesalePrice ? Number(prodForm.wholesalePrice) : undefined,
          moq: Number(prodForm.moq),
          unit: prodForm.unit,
          stockQuantity: Number(prodForm.stockQuantity),
          lowStockThreshold: Number(prodForm.lowStockThreshold),
          stockStatus: Number(prodForm.stockQuantity) > 0 ? 'in_stock' : 'out_of_stock',
          description: prodForm.description,
          freshnessDate: new Date().toISOString(),
          tags: [prodForm.name.toLowerCase(), prodForm.category.toLowerCase()],
          isActive: true
        });
        onShowToast('New product added and broadcasted to local radar!', 'success');
      }
      setShowProductModal(false);
    } catch (err: any) {
      onShowToast(err.message || 'Error saving product', 'error');
    }
  };

  const handleVerifyPickupCode = (reservationId: string) => {
    if (!pickupCodeInput.trim()) {
      onShowToast('Please enter the customer pickup code', 'warning');
      return;
    }
    const success = store.fulfillReservation(reservationId, pickupCodeInput);
    if (success) {
      onShowToast('Pickup code verified! Order marked as FULFILLED.', 'success');
      setPickupCodeInput('');
      setSelectedResId(null);
    } else {
      onShowToast('Invalid or mismatching Pickup Code. Fulfillment rejected.', 'error');
    }
  };

  const handleReverifyStock = (p: Product) => {
    store.reverifyProductStock(p.id);
    onShowToast(`Cryptographic stock hash updated for ${p.name}`, 'success');
  };

  const handleBatchImportCSV = () => {
    if (!csvRawText.trim()) {
      onShowToast('Please paste CSV contents or sample data', 'warning');
      return;
    }

    try {
      const lines = csvRawText.trim().split('\n');
      const items: any[] = [];
      
      // Parse header and rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 4) {
          items.push({
            name: parts[0],
            category: parts[1] || activeMerchant.category,
            sku: parts[2] || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            price: Number(parts[3]) || 100,
            wholesalePrice: parts[4] ? Number(parts[4]) : undefined,
            moq: parts[5] ? Number(parts[5]) : 1,
            unit: parts[6] || 'pcs',
            stockQuantity: Number(parts[7]) || 20,
            description: parts[8] || parts[0]
          });
        }
      }

      if (items.length === 0) {
        onShowToast('No valid CSV rows parsed. Check formatting.', 'error');
        return;
      }

      const importedCount = store.batchImportProducts(
        activeMerchant.id,
        activeBranchId || activeMerchant.branches[0]?.id,
        items
      );

      onShowToast(`Successfully imported ${importedCount} items into inventory!`, 'success');
      setCsvRawText('');
      setActiveTab('inventory');
    } catch (err: any) {
      onShowToast('CSV Parse error: ' + err.message, 'error');
    }
  };

  const sampleCsvTemplate = `Product Name,Category,SKU,Price,Wholesale Price,MOQ,Unit,Stock Quantity,Description
"Ultratech 43 Grade Cement","Hardware & Construction","HW-CEM-ULT-43",710,660,25,"bag (50kg)",180,"High durability portland cement"
"Anchor 16A Modular Switch","Hardware & Construction","HW-ELE-SW-16A",140,115,50,"pcs",400,"Fire-retardant poly-carbonate switch"
"N95 Filtration Pack 10s","Medical & Healthcare","MED-N95-10PK",850,720,5,"pack",65,"Layered particulate respirator"`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Merchant Profile Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {activeMerchant.businessName}
                </h1>
                {activeMerchant.verificationStatus === 'verified' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Business
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5" /> Pending Verification
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-1">
                Reg No: <strong className="text-slate-200">{activeMerchant.businessRegistrationNo}</strong> • Category: <strong className="text-slate-200">{activeMerchant.category}</strong> • City: <strong className="text-slate-200">{activeMerchant.city}</strong>
              </p>

              {/* Branch Selector */}
              <div className="flex items-center gap-2 mt-3 text-xs">
                <span className="text-slate-400 font-semibold">Active Yard / Branch:</span>
                <select
                  value={activeBranchId}
                  onChange={(e) => store.setActiveBranch(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-medium outline-none cursor-pointer"
                >
                  {activeMerchant.branches.map(b => (
                    <option key={b.id} value={b.id}>
                      📍 {b.branchName} ({b.operatingHours})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Digital Trust</span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-400">
                {activeMerchant.trustScore.toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Active Stock</span>
              <span className="text-base sm:text-lg font-extrabold text-blue-400">
                {merchantProducts.length} Items
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Pending Holds</span>
              <span className="text-base sm:text-lg font-extrabold text-amber-400">
                {reservations.filter(r => r.status === 'active').length}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Inventory ({merchantProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('demand')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'demand'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Demand Radar & Opportunities ({demandAnalysis.topOpportunities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'reservations'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Reservations & Orders ({reservations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rfqs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'rfqs'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>B2B RFQs ({rfqs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'import'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Batch Import</span>
          </button>
        </div>

        {activeTab === 'inventory' && (
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Tab 1: Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Item & SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Pricing</th>
                  <th className="p-4">Stock Quantity</th>
                  <th className="p-4">Status & Freshness</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {merchantProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No inventory items found. Click "Add New Product" or use "CSV Batch Import".
                    </td>
                  </tr>
                ) : (
                  merchantProducts.map((p) => {
                    const freshness = verifyStockFreshness(p, activeMerchant);
                    const isLow = p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0;
                    const isOut = p.stockQuantity <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{p.name}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                            SKU: {p.sku}
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {p.category}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-white">{formatCurrency(p.price)} / {p.unit}</div>
                          {p.wholesalePrice && (
                            <div className="text-[10px] text-amber-400">
                              Wholesale: {formatCurrency(p.wholesalePrice)} (MOQ {p.moq})
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-extrabold ${isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {p.stockQuantity} {p.unit}
                            </span>
                            
                            {/* Quick adjust buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => store.quickAdjustStock(p.id, -10)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
                                title="Subtract 10 units"
                              >
                                -10
                              </button>
                              <button
                                onClick={() => store.quickAdjustStock(p.id, 10)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
                                title="Add 10 units"
                              >
                                +10
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            {isOut ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Low Stock ({p.stockQuantity})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                In Stock
                              </span>
                            )}

                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                              <Zap className="w-3 h-3 text-cyan-400" />
                              <span>{freshness.statusText}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReverifyStock(p)}
                              title="Re-verify Freshness & Hash"
                              className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              title="Edit item"
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete ${p.name}?`)) {
                                  store.deleteProduct(p.id);
                                  onShowToast('Product removed', 'info');
                                }
                              }}
                              title="Delete item"
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Demand Signals & Market Opportunities */}
      {activeTab === 'demand' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base text-white">
                  Local Restocking Opportunities & Demand Heatmap
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Aggregated search misses & buyer stockout requests in your regional radius.
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 block font-medium">Estimated Unmet Market</span>
              <span className="text-xl font-extrabold text-amber-400">
                Rs. {demandAnalysis.totalEstimatedMarket.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demandAnalysis.topOpportunities.map((sig) => (
              <div
                key={sig.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      🔥 {sig.trendDirection.toUpperCase()} DEMAND
                    </span>
                    <h4 className="font-bold text-base text-white mt-1.5">
                      "{sig.queryTerm}"
                    </h4>
                    <span className="text-xs text-slate-400 block">
                      Cluster: {sig.locationCluster} • Category: {sig.category}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-emerald-400 block">
                      Rs. {sig.estimatedDemandValue.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-rose-400 font-semibold">
                      {sig.unmetCount} Missed Searches
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span>Detected: {formatTimeAgo(sig.detectedAt)}</span>
                  <button
                    onClick={() => handleOpenAddModal(sig.queryTerm, sig.category)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Restock / Add This Product</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Reservations & Pickup Code Verification */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <span>Customer Reservation Lock & Pickup Verification</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect customer hold orders and verify encrypted 6-digit pickup codes at counter.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reservations.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
                No customer reservations recorded yet.
              </div>
            ) : (
              reservations.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        res.status === 'fulfilled'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : res.status === 'active'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {res.status.toUpperCase()}
                      </span>
                      <h4 className="font-bold text-white text-base mt-1">{res.productName}</h4>
                      <div className="text-xs text-slate-400">
                        Buyer: <strong className="text-slate-200">{res.customerName}</strong> ({res.customerPhone})
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-white block">
                        {formatCurrency(res.totalPrice)}
                      </span>
                      <span className="text-xs text-slate-400">Qty: {res.quantity}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Mode: <strong>{res.fulfillmentType.toUpperCase()}</strong></span>
                    <span className="text-slate-400">Hold Expires: <strong>{formatTimeAgo(res.expiresAt)}</strong></span>
                  </div>

                  {res.status === 'active' && (
                    <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter Pickup Code (e.g. STK-7A9-V2X)"
                        value={selectedResId === res.id ? pickupCodeInput : ''}
                        onChange={(e) => {
                          setSelectedResId(res.id);
                          setPickupCodeInput(e.target.value);
                        }}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white uppercase font-mono outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleVerifyPickupCode(res.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                      >
                        Verify & Fulfill
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: B2B RFQs */}
      {activeTab === 'rfqs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30">
            <h3 className="font-extrabold text-base text-white">
              B2B Wholesale Quotations & Requests
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Respond with wholesale quotation discounts and contract notes.
            </p>
          </div>

          <div className="space-y-3">
            {rfqs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 rounded-2xl border border-slate-800">
                No wholesale RFQs received currently.
              </div>
            ) : (
              rfqs.map(rfq => (
                <div key={rfq.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        {rfq.status.toUpperCase()}
                      </span>
                      <h4 className="font-bold text-white text-sm sm:text-base mt-1">{rfq.productName}</h4>
                      <div className="text-xs text-slate-400">
                        Buyer: <strong className="text-slate-200">{rfq.customerName}</strong> ({rfq.customerEmail} / {rfq.customerPhone})
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-white block">Req Qty: {rfq.requestedQuantity}</span>
                      {rfq.targetPrice && (
                        <span className="text-xs text-amber-400">Target: {formatCurrency(rfq.targetPrice)}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    "{rfq.message}"
                  </p>

                  {rfq.status === 'quoted' && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex justify-between">
                      <span>Quoted Price: <strong>{formatCurrency(rfq.quotedPrice || 0)}</strong></span>
                      <span>Note: {rfq.responseMessage}</span>
                    </div>
                  )}

                  {rfq.status === 'pending' && respondingRfqId === rfq.id ? (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Your Quoted Unit Price (Rs.)"
                          value={rfqQuotePrice}
                          onChange={(e) => setRfqQuotePrice(Number(e.target.value))}
                          className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Note (e.g. Free delivery included for MOQ 50)"
                          value={rfqResponseMsg}
                          onChange={(e) => setRfqResponseMsg(e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setRespondingRfqId(null)}
                          className="px-3 py-1 bg-slate-800 text-xs text-slate-300 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            store.respondToRFQ(rfq.id, rfqQuotePrice, rfqResponseMsg);
                            onShowToast('Quotation sent to buyer', 'success');
                            setRespondingRfqId(null);
                          }}
                          className="px-4 py-1 bg-cyan-600 text-xs text-white font-bold rounded-lg"
                        >
                          Submit Quote
                        </button>
                      </div>
                    </div>
                  ) : (
                    rfq.status === 'pending' && (
                      <button
                        onClick={() => {
                          setRespondingRfqId(rfq.id);
                          setRfqQuotePrice(rfq.targetPrice || 500);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                      >
                        Respond with Wholesale Quote
                      </button>
                    )
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Batch CSV Import */}
      {activeTab === 'import' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Bulk CSV / Excel Product Importer</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste comma-separated inventory data to instantly create dozens of normalized products.
              </p>
            </div>

            <button
              onClick={() => setCsvRawText(sampleCsvTemplate)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Load Sample CSV</span>
            </button>
          </div>

          <textarea
            rows={8}
            value={csvRawText}
            onChange={(e) => setCsvRawText(e.target.value)}
            placeholder="Paste CSV rows here (Product Name,Category,SKU,Price,Wholesale Price,MOQ,Unit,Stock Quantity,Description)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-emerald-300 outline-none focus:border-emerald-500 resize-none"
          />

          <div className="flex justify-end">
            <button
              onClick={handleBatchImportCSV}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Process Batch Import</span>
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
              <h3 className="font-extrabold text-base text-white">
                {editingProductId ? 'Edit Product & Stock' : 'Add New Product to Inventory'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Title</label>
                <input
                  type="text"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="e.g. Shivam 53 Grade OPC Cement (50kg)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  >
                    {store.getCategories().map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price (Rs.)</label>
                  <input
                    type="number"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Wholesale Price</label>
                  <input
                    type="number"
                    value={prodForm.wholesalePrice}
                    onChange={(e) => setProdForm({ ...prodForm, wholesalePrice: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">MOQ</label>
                  <input
                    type="number"
                    value={prodForm.moq}
                    onChange={(e) => setProdForm({ ...prodForm, moq: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={prodForm.stockQuantity}
                    onChange={(e) => setProdForm({ ...prodForm, stockQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={prodForm.unit}
                    onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                    placeholder="e.g. bag, pcs, kg"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Low Stock Limit</label>
                  <input
                    type="number"
                    value={prodForm.lowStockThreshold}
                    onChange={(e) => setProdForm({ ...prodForm, lowStockThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Saving will re-generate the cryptographic tamper-evident freshness hash for consumers.</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
              >
                {editingProductId ? 'Save Changes' : 'Publish to Verified Radar'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
