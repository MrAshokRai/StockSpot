-- MIGRATION 005: Missing RPCs, upsert targets, hardened policies, v_demand_summary rebuild
-- Applied live via Supabase MCP: 2026-09-20 (migration: add_missing_rpcs_and_harden_policies
-- + pr_index_plain_and_v_stock_merchant_id + products_slug_unique_and_backfill)

-- ===========================
-- 1. increment_reserved RPC (was missing live -> order creation failed)
-- ===========================

CREATE OR REPLACE FUNCTION public.increment_reserved(p_id uuid, p_qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.inventory_items
  SET reserved_quantity = reserved_quantity + p_qty,
      last_updated = now()
  WHERE id = p_id
    AND reserved_quantity + p_qty <= quantity;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found or insufficient available stock';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_reserved(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_reserved(uuid, integer) TO authenticated;

-- ===========================
-- 2. product_requests unique target (plain columns so PostgREST onConflict works)
-- ===========================

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_requests_query_city
  ON public.product_requests (query_text, city);

-- request_product RPC: secure merge (increments cross-user, owner set server-side)
CREATE OR REPLACE FUNCTION public.request_product(
  p_query_text text,
  p_city text,
  p_district text DEFAULT NULL,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.product_requests (user_id, query_text, city, district, latitude, longitude, request_count)
  VALUES (auth.uid(), p_query_text, p_city, p_district, p_latitude, p_longitude, 1)
  ON CONFLICT (query_text, city)
  DO UPDATE SET
    request_count = public.product_requests.request_count + 1,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.request_product(text, text, text, double precision, double precision) FROM public;
GRANT EXECUTE ON FUNCTION public.request_product(text, text, text, double precision, double precision) TO authenticated;

-- ===========================
-- 3. notifications insert spoofing fix (any authenticated user could insert for anyone)
-- ===========================

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated, service_role
  WITH CHECK (public.is_admin());

-- ===========================
-- 4. product_requests update fix (any authenticated user could update any row)
-- ===========================

DROP POLICY IF EXISTS "Authenticated users can update request count" ON public.product_requests;
CREATE POLICY "Users can update own product requests"
  ON public.product_requests FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===========================
-- 5. v_stock_availability: canonical shape + merchant_id exposed (security_invoker)
-- ===========================

DROP VIEW IF EXISTS public.v_stock_availability;

CREATE VIEW public.v_stock_availability
WITH (security_invoker = true)
AS
SELECT
  ii.id AS inventory_item_id,
  ii.product_id,
  ii.branch_id AS shop_id,
  mb.merchant_id,
  p.name AS product_name,
  p.brand,
  p.model,
  p.normalized_name,
  mb.branch_name AS shop_name,
  mb.city,
  mb.district,
  mb.latitude::double precision AS latitude,
  mb.longitude::double precision AS longitude,
  m.business_name,
  (m.verification_status = 'verified'::verification_status) AS is_verified,
  (COALESCE(m.trust_score, 0) / 100.0) AS trust_score,
  ii.quantity,
  ii.reserved_quantity,
  (ii.quantity - ii.reserved_quantity) AS available_quantity,
  ii.price,
  ii.wholesale_price,
  ii.min_order_quantity,
  ii.last_updated,
  ii.is_available,
  CASE
    WHEN ii.last_updated > (now() - '00:30:00'::interval) THEN 'high'::text
    WHEN ii.last_updated > (now() - '04:00:00'::interval) THEN 'medium'::text
    ELSE 'low'::text
  END AS stock_confidence
FROM public.inventory_items ii
JOIN public.products p ON p.id = ii.product_id
JOIN public.merchant_branches mb ON mb.id = ii.branch_id
JOIN public.merchants m ON m.id = mb.merchant_id
WHERE ii.is_available = true
  AND m.verification_status = 'verified'::verification_status;

GRANT SELECT ON public.v_stock_availability TO anon, authenticated, service_role;

-- ===========================
-- 6. v_demand_summary: canonical shape (real product join + branch-based available_shops)
-- ===========================

DROP VIEW IF EXISTS public.v_demand_summary;

CREATE VIEW public.v_demand_summary
WITH (security_invoker = true)
AS
SELECT
  ds.product_id,
  COALESCE(p.name, ds.query_text) AS product_name,
  ds.city,
  count(*)::integer AS search_count,
  count(DISTINCT ds.user_id)::integer AS unique_users,
  min(ds.created_at) AS first_seen,
  max(ds.created_at) AS last_seen,
  (
    SELECT count(DISTINCT ii.branch_id)::integer
    FROM public.inventory_items ii
    WHERE ii.product_id = ds.product_id
      AND ii.is_available = true
      AND ii.quantity > 0
  ) AS available_shops
FROM public.demand_signals ds
LEFT JOIN public.products p ON p.id = ds.product_id
WHERE ds.created_at > now() - interval '7 days'
GROUP BY ds.product_id, p.name, ds.query_text, ds.city;

GRANT SELECT ON public.v_demand_summary TO anon, authenticated, service_role;

-- ===========================
-- 7. products.slug unique index (onConflict:slug upserts need it)
-- ===========================

UPDATE public.products
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || right(id::text, 6)
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
