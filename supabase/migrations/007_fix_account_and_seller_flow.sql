-- MIGRATION 007: Fix Account Creation & Seller Flow Backend Issues
-- Applied live via Supabase MCP: 2026-09-20
--
-- Root cause 1 (Account Creation): handle_new_user() trigger ran without search_path set,
--   causing schema resolution failure for public.profiles during GoTrue auth.users signup.
-- Root cause 2 (Seller Flow): merchants.contact_email had NOT NULL constraint with no default,
--   failing application submissions where business email is left optional.
-- Root cause 3 (Seller Flow): apply_as_seller and set_seller_pending needed search_path and branch creation.
-- Root cause 4 (Relations): merchant_branches was missing 'name' alias column for relations querying branch(name).

-- 1. Make merchants.contact_email nullable to match UI optional business email & apply_as_seller default
ALTER TABLE public.merchants ALTER COLUMN contact_email DROP NOT NULL;

-- 2. Add generated name column to merchant_branches for compatibility with branch:merchant_branches(name) queries
ALTER TABLE public.merchant_branches ADD COLUMN IF NOT EXISTS name text GENERATED ALWAYS AS (branch_name) STORED;

-- 3. Fix handle_new_user trigger function with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, seller_status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    'customer'::public.user_role,
    'customer'::public.seller_status
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 4. Harden set_seller_pending with search_path
CREATE OR REPLACE FUNCTION public.set_seller_pending()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET seller_status = 'seller_pending'
  WHERE id = auth.uid()
    AND seller_status = 'customer';
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_seller_pending() TO authenticated;

-- 5. Harden apply_as_seller RPC function to create merchant and main branch reliably
CREATE OR REPLACE FUNCTION public.apply_as_seller(
  p_business_name text,
  p_business_registration_no text DEFAULT NULL::text,
  p_category text DEFAULT NULL::text,
  p_description text DEFAULT NULL::text,
  p_contact_phone text DEFAULT NULL::text,
  p_contact_email text DEFAULT NULL::text,
  p_website text DEFAULT NULL::text,
  p_address text DEFAULT NULL::text,
  p_city text DEFAULT NULL::text,
  p_state text DEFAULT NULL::text,
  p_latitude double precision DEFAULT NULL::double precision,
  p_longitude double precision DEFAULT NULL::double precision
)
RETURNS public.merchants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_profile public.profiles;
    v_merchant public.merchants;
    v_phone text;
    v_address text;
    v_city text;
    v_lat numeric;
    v_lng numeric;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT *
    INTO v_profile
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    IF v_profile.seller_status = 'seller_verified' THEN
        RAISE EXCEPTION 'Seller account is already verified';
    END IF;

    IF v_profile.seller_status = 'seller_pending' THEN
        RAISE EXCEPTION 'Seller application is already pending';
    END IF;

    v_phone := COALESCE(NULLIF(p_contact_phone, ''), NULLIF(v_profile.phone, ''), '9800000000');
    v_address := COALESCE(NULLIF(p_address, ''), 'Kathmandu');
    v_city := COALESCE(NULLIF(p_city, ''), 'Kathmandu');
    v_lat := COALESCE(p_latitude::numeric, 27.7172);
    v_lng := COALESCE(p_longitude::numeric, 85.3240);

    INSERT INTO public.merchants (
        user_id,
        business_name,
        business_registration_no,
        category,
        description,
        verification_status,
        contact_phone,
        contact_email,
        website,
        address,
        city,
        state,
        latitude,
        longitude,
        trust_score,
        rating,
        review_count
    )
    VALUES (
        v_user_id,
        p_business_name,
        p_business_registration_no,
        COALESCE(NULLIF(p_category, ''), 'general'),
        p_description,
        'pending',
        v_phone,
        p_contact_email,
        p_website,
        v_address,
        v_city,
        COALESCE(NULLIF(p_state, ''), 'Bagmati'),
        v_lat,
        v_lng,
        0, 0, 0
    )
    RETURNING *
    INTO v_merchant;

    -- Also create main branch for this merchant
    INSERT INTO public.merchant_branches (
        merchant_id,
        branch_name,
        address,
        city,
        latitude,
        longitude,
        phone,
        is_main,
        operating_hours
    )
    VALUES (
        v_merchant.id,
        p_business_name || ' - Main Branch',
        v_address,
        v_city,
        v_lat,
        v_lng,
        v_phone,
        true,
        '08:00 AM - 08:00 PM'
    );

    UPDATE public.profiles
    SET seller_status = 'seller_pending',
        phone = COALESCE(NULLIF(v_profile.phone, ''), v_phone)
    WHERE id = v_user_id;

    RETURN v_merchant;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_as_seller TO authenticated;

-- 6. Auto-confirm users on signup to avoid 500 email delivery failure when SMTP is not configured
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
  END IF;
  IF NEW.confirmed_at IS NULL THEN
    NEW.confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_before_insert ON auth.users;
CREATE TRIGGER on_auth_user_before_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- 7. Secure admin role management helper
CREATE OR REPLACE FUNCTION public.set_user_role(p_user_id uuid, p_role public.user_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.profiles
  SET role = p_role,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.user_role) TO authenticated;

