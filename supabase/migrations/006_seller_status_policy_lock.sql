-- MIGRATION 006: Close seller_status self-escalation hole
-- Applied live via Supabase MCP: 2026-09-20 (migration: close_seller_status_self_escalation)
--
-- SECURITY FIX: direct client UPDATE could set seller_status = 'seller_verified'
-- (the 003/004 policy only locked `role`). Escalation now only via SECURITY DEFINER RPCs:
--   set_seller_pending()        customer -> seller_pending (self, gated to customer state)
--   approve_seller(uuid)        admin -> seller_verified (server-side, admin-only check)
--
-- Verified live (rolled-back tx): self-verify UPDATE fails 42501; legit own-row
-- update succeeds; set_seller_pending() RPC path still works; cross-user
-- merchants/notifications/product_requests writes all blocked by RLS.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND seller_status = (SELECT p.seller_status FROM public.profiles p WHERE p.id = auth.uid())
  );
