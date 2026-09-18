# 🛰️ StockSpot | Real-Time Inventory Discovery & Digital Trust Radar

> **Hackathon Theme Alignment**:
> - **05 Livelihood & Local Commerce**: Real-time physical inventory discovery, multi-branch management, B2B wholesale tiers, and demand signal heatmaps for MSMEs & local merchants.
> - **01 Cybersecurity, Privacy & Digital Trust**: Zero-ghost inventory guarantee, cryptographic SHA-256 stock freshness ledger, KYC merchant verification audits, and tamper-resistant reservation holds.

---

## 📌 Executive Summary & Value Proposition

### 🔴 The Problem
1. **For Consumers & Buyers**: Physical store inventory is a black box. Customers waste hours calling or driving to stores only to find items out of stock, prices inflated, or merchants unverified.
2. **For Local Merchants & SMBs**: Small businesses have no visibility into unmet local customer search demand, losing out on restocking opportunities and high-margin B2B bulk orders to centralized mega-eCommerce.

### 🟢 The Solution
**StockSpot** is a real-time, proximity-aware inventory discovery and digital trust platform.
- **Buyers** search in natural language ("50 bags cement near Lalitpur urgent"), view verified nearby stock with cryptographic freshness timestamps, inspect trust scores, and lock in 4-hour reservations with encrypted pickup codes. If an item is out of stock, AI instant substitute matching recommends nearby compatible items.
- **Merchants** access real-time demand radar heatmaps that convert missed searches into actionable restocking signals (with estimated market value in Rs.), manage multi-branch inventory, process CSV batch imports, and negotiate wholesale B2B quotes.
- **Governments & Regulators** audit merchant KYC compliance and monitor system integrity through immutable security audit logs.

---

## 🌟 Key Features & Innovations

### 1. 🔍 AI Natural Language & Proximity Discovery
- **Natural Language Query Parser**: Automatically detects product intent, target quantities, regional location, urgency level, and B2B wholesale thresholds.
- **Interactive Geo-Inventory Radar**: Visual concentric proximity canvas (2km to 50km) with live stock counters and store nodes.
- **Zero-Ghost Stock Freshness Verifier**: Every stock change is stamped with a deterministic SHA-256 cryptographic verification hash (`0x...`).

### 2. 🛡️ Digital Trust & KYC Governance
- **Trust Score Engine (0-100%)**: Multi-factor trust rating based on business registration verification (40%), stock freshness frequency (25%), fulfillment rate (20%), and customer reviews (15%).
- **Digital Trust Certificate**: Instant verifiable cryptographic ledger proof displaying tax registration, KYC audit level, and stock integrity guarantees.
- **Anti-Ghost Reservation Lock**: Customers hold items for 4 hours; inventory is decremented instantly, and an encrypted 6-digit pickup code (`STK-XXX-XXX`) is issued. Counter staff verify the code before release.

### 3. 🤖 AI Stockout Substitute & Alternative Recommender
- When a product is low or out of stock, the semantic engine analyzes category specs, proximity, and pricing delta to present 1-click alternative options.

### 4. 📈 Merchant Restock Radar & Demand Heatmaps
- Aggregates consumer search misses and stockout wanted requests into regional demand hotspots.
- Calculates **Estimated Unmet Market Potential (Rs.)** and provides a 1-click button to restock and satisfy the demand.

### 5. 🏢 B2B Wholesale & RFQ Engine
- Supports tiered wholesale pricing and Minimum Order Quantities (MOQ).
- Built-in Request for Quote (RFQ) messaging between contractors/wholesalers and distributors.

### 6. 📁 Batch CSV/Excel Product Importer
- Merchants can import hundreds of product SKUs with category, price, and stock levels in seconds.

---

## 🔒 Security & Privacy Architecture

| Vector | Protection Mechanism |
|---|---|
| **XSS & Injection** | Strict regex input sanitization on all client & server payloads |
| **API Abuse & Flooding** | Token Bucket Rate Limiter (60 search req/min, 10 RFQ req/min) |
| **Data Leakage** | Complete Row Level Security (RLS) policies in PostgreSQL/Supabase |
| **Secret Management** | Zero service keys or private credentials exposed to frontend |
| **Audit Compliance** | Immutable security audit logs with one-way SHA-256 IP hashing |
| **Anti-Tamper Holding** | Cryptographically validated 4-hour reservation codes |

---

## 💻 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **State & Architecture**: Reactive Central Store with persistent Indexed/Local layer & Real-time Supabase sync adapter
- **Backend & Database**: Supabase PostgreSQL with full RLS migrations, Enums, and Triggers
- **Hosting & Edge**: Netlify SPA with strict CSP, X-Frame-Options, and Security Headers

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ (tested on Node v22)
- npm or pnpm

### Installation & Local Run
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```

---

## 🎭 Demo Personas & Test Flow for Judges

Use the **Persona Switcher** in the top-right navbar to test all perspectives:

1. **🧑 Customer (Aayush Adhikari)**:
   - Search: *"50 bags 53 grade cement near Lalitpur"*
   - Observe AI NLP tag extraction and verified store cards.
   - Click **Reserve Stock** on *Shivam 53 Grade OPC Cement* → Generates Pickup Code.
   - Search *"3M N95 Respirator"* (Out of stock) → Click **AI Substitute Finder** → View instant alternatives.
   - Click **Wanted Request** to broadcast unmet demand to local suppliers.

2. **🏪 Merchant (Pioneer Construction / Himalayan Organic)**:
   - Switch to **Merchant Portal**.
   - View the **Demand Radar & Restocking Opportunities** tab (shows unmet search potential of Rs. 345,000+).
   - Click **Restock / Add This Product** to satisfy buyer demand in 1 click.
   - In **Reservations**, enter customer pickup code to verify and fulfill counter collection.
   - Test **CSV Batch Import** with 1-click sample data.

3. **🛡️ Admin / Security Auditor**:
   - Switch to **Admin Trust Guard**.
   - Review and approve pending Merchant KYC licenses (Everest Bio-Nutrients).
   - Inspect the **Live Security Audit Stream** showing real-time cryptographic logs and IP hashes.
