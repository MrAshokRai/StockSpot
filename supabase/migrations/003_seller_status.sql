-- MIGRATION 003: Seller Status & Onboarding Redesign
-- Applied: 2026-09-19
-- Adds seller_status to profiles for the new customer/seller flow.
-- Existing role column is kept for admin and backward compat.

-- ===========================
-- SELLER STATUS ENUM
-- ===========================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'seller_status') then
    create type seller_status as enum ('customer', 'seller_pending', 'seller_verified');
  end if;
end$$;

-- ===========================
-- ADD seller_status TO profiles
-- ===========================

alter table profiles
  add column if not exists seller_status seller_status not null default 'customer';

-- ===========================
-- UPDATE handle_new_user TRIGGER
-- Always creates new users as customer, seller_status = customer
-- Ignores any role passed in metadata (security: client cannot self-assign seller)
-- ===========================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role, seller_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'customer',          -- always customer on signup; seller_status controls upgrade
    'customer'
  );
  return new;
end;
$$ language plpgsql security definer;

-- ===========================
-- SELLER APPLICATION FUNCTION
-- Called server-side after user creates a business application
-- Sets seller_status = seller_pending (cannot be done via direct client UPDATE)
-- ===========================

create or replace function set_seller_pending(p_user_id uuid default auth.uid())
returns void as $$
begin
  update profiles
  set seller_status = 'seller_pending'
  where id = coalesce(p_user_id, auth.uid())
    and seller_status = 'customer';
end;
$$ language plpgsql security definer;

grant execute on function set_seller_pending(uuid) to authenticated;

create or replace function set_seller_pending()
returns void as $$
begin
  perform set_seller_pending(auth.uid());
end;
$$ language plpgsql security definer;

grant execute on function set_seller_pending() to authenticated;

-- ===========================
-- SELLER APPROVAL FUNCTION
-- Called server-side (admin action)
-- Atomically approves business + upgrades user to seller_verified
-- ===========================

create or replace function approve_seller(business_id uuid)
returns void as $$
declare
  v_owner_id uuid;
begin
  -- Get business owner
  select owner_id into v_owner_id from businesses where id = business_id;
  if v_owner_id is null then
    raise exception 'Business not found';
  end if;

  -- Update business
  update businesses
  set verification_status = 'verified',
      is_verified = true,
      updated_at = now()
  where id = business_id;

  -- Upgrade owner profile to seller_verified and role to seller
  update profiles
  set seller_status = 'seller_verified',
      role = 'seller',
      updated_at = now()
  where id = v_owner_id;
end;
$$ language plpgsql security definer;

grant execute on function approve_seller(uuid) to authenticated;

create or replace function approve_seller_application(p_business_id uuid)
returns void as $$
begin
  perform approve_seller(p_business_id);
end;
$$ language plpgsql security definer;

grant execute on function approve_seller_application(uuid) to authenticated;

-- ===========================
-- SELLER REJECTION FUNCTION
-- Called server-side (admin action)
-- Rejects business, reverts user to customer status
-- ===========================

create or replace function reject_seller_application(p_business_id uuid)
returns void as $$
declare
  v_owner_id uuid;
begin
  -- Get business owner
  select owner_id into v_owner_id from businesses where id = p_business_id;
  if v_owner_id is null then
    raise exception 'Business not found';
  end if;

  -- Update business
  update businesses
  set verification_status = 'rejected',
      is_verified = false,
      updated_at = now()
  where id = p_business_id;

  -- Revert owner back to customer
  update profiles
  set seller_status = 'customer',
      role = 'customer',
      updated_at = now()
  where id = v_owner_id
    and seller_status = 'seller_pending';
end;
$$ language plpgsql security definer;

grant execute on function reject_seller_application(uuid) to authenticated;

-- ===========================
-- RLS SECURITY POLICIES FOR PROFILES
-- Prevent direct client update of seller_status to seller_verified or role to seller/admin
-- ===========================

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      seller_status != 'seller_verified'
      or (select seller_status from profiles where id = auth.uid()) = 'seller_verified'
    )
    and (
      role = (select role from profiles where id = auth.uid())
    )
  );

-- ===========================
-- BACKFILL: Set existing sellers to seller_verified
-- ===========================

update profiles
set seller_status = 'seller_verified'
where role = 'seller'
  and seller_status = 'customer';

-- ===========================
-- INDEX on seller_status for admin queries
-- ===========================

create index if not exists idx_profiles_seller_status on profiles(seller_status);
