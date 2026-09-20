-- MIGRATION 004: Profiles RLS Recursion Fix + shops/businesses View Rebuild
-- Applied live via Supabase MCP: 2026-09-20 (migrations: fix_profiles_rls_recursion,
-- fix_shops_businesses_views_updatable, make_shops_view_fully_updatable, shops_view_single_table)
--
-- Root cause: live profiles policies self-referenced the profiles table inside
-- policy subqueries -> ERROR 42P17 infinite recursion on EVERY authenticated query.
-- Every login, onboarding, middleware check, admin and seller page was broken.

-- ===========================
-- 1. SECURITY DEFINER helper (no recursion: policy eval never re-enters profiles RLS)
-- ===========================

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- ===========================
-- 2. Drop the recursive policies and recreate
-- ===========================

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Owner update: role stays immutable (WITH CHECK compares against stored row)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- Admin full access via the SECURITY DEFINER helper (no recursion)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ===========================
-- 3. merchant_branches real columns (shops view passthrough + settings writes)
-- ===========================

ALTER TABLE public.merchant_branches
  ADD COLUMN IF NOT EXISTS allows_pickup boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allows_delivery boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS district text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_radius_km numeric(5,2) NOT NULL DEFAULT 5.0;

UPDATE public.merchant_branches mb
SET district = COALESCE(mb.district, '')
WHERE mb.district IS NULL;

ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS logo_url text;

-- ===========================
-- 4. Rebuild shops view: single-table (auto-updatable), safe casts, security_invoker
--    Old view: invalid ::jsonb cast (22P02 on read), JOIN (not updatable), hardcoded flags
-- ===========================

DROP VIEW IF EXISTS public.shops;

CREATE VIEW public.shops
WITH (security_invoker = true)
AS
SELECT
  mb.id,
  mb.merchant_id AS business_id,
  mb.branch_name AS name,
  mb.address,
  mb.city,
  mb.district,
  mb.latitude::double precision AS latitude,
  mb.longitude::double precision AS longitude,
  mb.phone,
  to_jsonb(mb.operating_hours) AS opening_hours,
  mb.is_active,
  mb.allows_pickup,
  mb.allows_delivery,
  mb.delivery_radius_km,
  mb.created_at,
  mb.created_at AS updated_at
FROM public.merchant_branches mb;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shops TO anon, authenticated, service_role;

-- ===========================
-- 5. Rebuild businesses view: straight column refs (auto-updatable), security_invoker
--    Old view: expression columns blocked UPDATE through the view
-- ===========================

CREATE OR REPLACE VIEW public.businesses
WITH (security_invoker = true)
AS
SELECT
  m.id,
  m.user_id AS owner_id,
  m.business_name AS name,
  m.description,
  m.category,
  m.contact_phone AS phone,
  m.contact_email AS email,
  m.website,
  m.logo_url,
  (m.verification_status = 'verified'::verification_status) AS is_verified,
  m.verification_status,
  (COALESCE(m.trust_score, 0) / 100.0) AS trust_score,
  m.created_at,
  m.verified_at AS updated_at
FROM public.merchants m;

-- ===========================
-- 6. Sanity guard
-- ===========================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
