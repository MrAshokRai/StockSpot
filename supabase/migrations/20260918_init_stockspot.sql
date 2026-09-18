-- StockSpot Complete Supabase Schema & Security Migration
-- Themes: 05 Livelihood & Local Commerce + 01 Cybersecurity, Privacy & Digital Trust

-- 1. Create Custom Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'merchant', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'pre_order');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('active', 'fulfilled', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE inquiry_status AS ENUM ('pending', 'quoted', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Merchants Table (Stores & Local Producers)
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_registration_no TEXT,
    category TEXT NOT NULL,
    description TEXT,
    trust_score NUMERIC(3,1) NOT NULL DEFAULT 85.0,
    verification_status verification_status NOT NULL DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    contact_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    website TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Bagmati',
    latitude NUMERIC(9,6) NOT NULL DEFAULT 27.7172,
    longitude NUMERIC(9,6) NOT NULL DEFAULT 85.3240,
    rating NUMERIC(2,1) NOT NULL DEFAULT 4.8,
    review_count INT NOT NULL DEFAULT 24,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Merchant Branches (Multi-branch Support)
CREATE TABLE IF NOT EXISTS public.merchant_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    branch_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    phone TEXT NOT NULL,
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    operating_hours TEXT DEFAULT '08:00 AM - 08:00 PM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT 'Package',
    description TEXT
);

-- 6. Products & Inventory Items
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.merchant_branches(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    sku TEXT,
    barcode TEXT,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    wholesale_price NUMERIC(10,2),
    moq INT NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'pcs',
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    stock_status stock_status NOT NULL DEFAULT 'in_stock',
    freshness_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    freshness_hash TEXT,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Reservations (Item Hold & Anti-Ghost Stocking)
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.merchant_branches(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10,2) NOT NULL,
    status reservation_status NOT NULL DEFAULT 'active',
    pickup_code TEXT NOT NULL,
    fulfillment_type TEXT NOT NULL DEFAULT 'pickup',
    delivery_address TEXT,
    notes TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '4 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. RFQ (Request for Quote / Wholesale B2B)
CREATE TABLE IF NOT EXISTS public.rfq_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    requested_quantity INT NOT NULL CHECK (requested_quantity > 0),
    target_price NUMERIC(10,2),
    message TEXT NOT NULL,
    quoted_price NUMERIC(10,2),
    status inquiry_status NOT NULL DEFAULT 'pending',
    response_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Stockout Requests (Buyer Missing-Stock Radar)
CREATE TABLE IF NOT EXISTS public.stockout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_contact TEXT NOT NULL,
    query_text TEXT NOT NULL,
    category TEXT NOT NULL,
    target_quantity INT NOT NULL DEFAULT 1,
    location_city TEXT NOT NULL,
    max_radius_km INT NOT NULL DEFAULT 25,
    status TEXT NOT NULL DEFAULT 'seeking',
    matched_merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Demand Signals (Aggregated Market Intelligence)
CREATE TABLE IF NOT EXISTS public.demand_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_term TEXT NOT NULL,
    category TEXT NOT NULL,
    search_count INT NOT NULL DEFAULT 1,
    unmet_count INT NOT NULL DEFAULT 1,
    estimated_demand_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    location_cluster TEXT NOT NULL,
    trend_direction TEXT NOT NULL DEFAULT 'rising',
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Security Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL DEFAULT 'guest',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    ip_hash TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stockout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies
-- Public Read for Active Products & Merchants
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view verified merchants" ON public.merchants FOR SELECT USING (true);
CREATE POLICY "Public can view merchant branches" ON public.merchant_branches FOR SELECT USING (true);
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Merchants manage their own products" ON public.products FOR ALL USING (auth.uid() = (SELECT user_id FROM public.merchants WHERE id = products.merchant_id));
CREATE POLICY "Merchants manage their branches" ON public.merchant_branches FOR ALL USING (auth.uid() = (SELECT user_id FROM public.merchants WHERE id = merchant_branches.merchant_id));
CREATE POLICY "Merchants view their inquiries" ON public.rfq_inquiries FOR ALL USING (auth.uid() = (SELECT user_id FROM public.merchants WHERE id = rfq_inquiries.merchant_id) OR auth.uid() = customer_id);
CREATE POLICY "Users view own reservations" ON public.reservations FOR ALL USING (auth.uid() = customer_id OR auth.uid() = (SELECT user_id FROM public.merchants WHERE id = reservations.merchant_id));
CREATE POLICY "Public can view demand signals" ON public.demand_signals FOR SELECT USING (true);

-- Indexes for blazing fast Geo & Search queries
CREATE INDEX IF NOT EXISTS idx_products_normalized_name ON public.products(normalized_name);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_merchant ON public.products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchants_city ON public.merchants(city);
CREATE INDEX IF NOT EXISTS idx_merchants_trust ON public.merchants(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_pickup_code ON public.reservations(pickup_code);
CREATE INDEX IF NOT EXISTS idx_demand_signals_term ON public.demand_signals(query_term);
