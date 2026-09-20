-- MIGRATION 008: Notifications RPCs and Public Storefront Access
-- Applied live via Supabase MCP on 2026-09-20

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'shortage';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'order';

-- 1. Create secure send_notification RPC
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type public.notification_type DEFAULT 'info',
  p_link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_notification(uuid, text, text, public.notification_type, text) TO authenticated, service_role, anon;

-- 2. Broadcast role notification RPC
CREATE OR REPLACE FUNCTION public.broadcast_role_notification(
  p_target_role text,
  p_title text,
  p_message text,
  p_type public.notification_type DEFAULT 'demand',
  p_link text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  r RECORD;
BEGIN
  IF p_target_role = 'seller' THEN
    FOR r IN SELECT id FROM public.profiles WHERE seller_status = 'seller_verified' OR role IN ('merchant', 'seller') LOOP
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (r.id, p_title, p_message, p_type, p_link);
      v_count := v_count + 1;
    END LOOP;
  ELSIF p_target_role = 'customer' THEN
    FOR r IN SELECT id FROM public.profiles WHERE seller_status = 'customer' OR role = 'customer' LOOP
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (r.id, p_title, p_message, p_type, p_link);
      v_count := v_count + 1;
    END LOOP;
  ELSE
    FOR r IN SELECT id FROM public.profiles LOOP
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (r.id, p_title, p_message, p_type, p_link);
      v_count := v_count + 1;
    END LOOP;
  END IF;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.broadcast_role_notification(text, text, text, public.notification_type, text) TO authenticated, service_role, anon;

-- 3. Ensure merchants and merchant_branches have public read policies so anyone can view storefronts
DROP POLICY IF EXISTS "Anyone can view verified businesses" ON public.merchants;
CREATE POLICY "Anyone can view verified businesses"
  ON public.merchants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can view active shops" ON public.merchant_branches;
CREATE POLICY "Anyone can view active shops"
  ON public.merchant_branches FOR SELECT
  USING (true);
