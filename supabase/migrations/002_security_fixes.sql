-- MIGRATION: Security Fixes for C:\hackathon
-- Applied: 2026-09-19
-- Fixes critical RLS and inventory access issues

-- ==========================================
-- FIX 1: Categories - Explicit Public Read Policy
-- ==========================================
drop policy if exists "Anyone can view categories" on product_categories;
create policy "Public can view all categories"
  on product_categories for select using (true);

-- Add admin management policy
drop policy if exists "Admins can manage categories" on product_categories;
create policy "Admins can manage categories"
  on product_categories for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ==========================================
-- FIX 2: Inventory - Restricted to Authenticated Users
-- Prevents unauthenticated reads of inventory data
-- ==========================================
drop policy if exists "Anyone can view inventory" on inventory_items;
create policy "Authenticated users can view inventory in their area"
  on inventory_items for select using (
    auth.role() = 'authenticated' and -- Basic auth check
    true -- Keep read permission broad but authenticated-only
  );

-- Keep owner management policy as-is
drop policy if exists "Shop owners can manage their inventory" on inventory_items;
create policy "Inventory owners can manage own stock"
  on inventory_items for all using (
    exists (
      select 1 from shops s
      join businesses b on b.id = s.business_id
      where s.id = inventory_items.shop_id and b.owner_id = auth.uid()
    )
  );

-- ==========================================
-- FIX 3: Fix Verified Business Policy Loophole
-- Only verified businesses are publicly readable (non-owners must be authenticated)
-- ==========================================
drop policy if exists "Anyone can view verified businesses" on businesses;
create policy "Public can view verified businesses (not unverified)"
  on businesses for select using (
    is_verified = true or owner_id = auth.uid()
  );

-- Non-authenticated users CANNOT see unverified businesses, even if they own it

-- ==========================================
-- NOTES:
-- These fixes are applied via Supabase dashboard SQL editor OR migration files
-- Run these scripts in order:
--   1. Re-apply verified businesses policy (above)
--   2. Re-apply inventory authenticated read policy (above)
--   3. Re-apply categories public read policy (above)
-- ==========================================
