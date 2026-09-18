-- StockSpot Database Schema
-- Nationwide Real-Time Inventory Discovery & Demand-Matching Platform

-- Enable PostGIS for location queries
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ===========================
-- ENUMS
-- ===========================

create type user_role as enum ('customer', 'seller', 'admin');
create type verification_status as enum ('pending', 'verified', 'rejected');
create type order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled');
create type fulfillment_type as enum ('pickup', 'delivery');
create type reservation_status as enum ('active', 'confirmed', 'picked_up', 'expired', 'cancelled');
create type demand_signal_type as enum ('search', 'product_request', 'reservation_attempt', 'unavailable_search');
create type product_request_status as enum ('open', 'fulfilled', 'closed');
create type stock_confidence as enum ('high', 'medium', 'low');
create type notification_type as enum ('info', 'warning', 'success', 'demand');

-- ===========================
-- TABLES
-- ===========================

-- User profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null default '',
  role user_role not null default 'customer',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Businesses
create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  category text not null default 'general',
  phone text not null,
  email text,
  website text,
  logo_url text,
  is_verified boolean not null default false,
  verification_status verification_status not null default 'pending',
  trust_score numeric(3,2) not null default 0.50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Shop branches
create table shops (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  address text not null,
  city text not null,
  district text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  location geography(Point, 4326) generated always as (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  ) stored,
  phone text not null,
  opening_hours jsonb default '{}',
  is_active boolean not null default true,
  allows_pickup boolean not null default true,
  allows_delivery boolean not null default false,
  delivery_radius_km numeric(5,2) default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Product categories
create table product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  parent_id uuid references product_categories(id),
  icon text,
  sort_order integer not null default 0
);

-- Products (normalized catalog)
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  category_id uuid references product_categories(id),
  brand text,
  model text,
  variant text,
  unit text not null default 'piece',
  sku text,
  barcode text,
  image_url text,
  attributes jsonb default '{}',
  normalized_name text not null,
  search_keywords text[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Inventory items (product availability per shop)
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  quantity integer not null default 0,
  reserved_quantity integer not null default 0,
  price numeric(10,2) not null default 0,
  wholesale_price numeric(10,2),
  min_order_quantity integer not null default 1,
  last_updated timestamptz not null default now(),
  last_sold_at timestamptz,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  unique(product_id, shop_id)
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id),
  shop_id uuid not null references shops(id),
  status order_status not null default 'pending',
  fulfillment_type fulfillment_type not null default 'pickup',
  total_amount numeric(10,2) not null default 0,
  notes text,
  delivery_address text,
  delivery_lat double precision,
  delivery_lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  inventory_item_id uuid not null references inventory_items(id),
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null
);

-- Reservations
create table reservations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id),
  shop_id uuid not null references shops(id),
  inventory_item_id uuid not null references inventory_items(id),
  quantity integer not null default 1,
  status reservation_status not null default 'active',
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now()
);

-- Demand signals
create table demand_signals (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  query_text text not null,
  signal_type demand_signal_type not null,
  city text not null,
  district text,
  latitude double precision,
  longitude double precision,
  user_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Product requests (when no shop has the product)
create table product_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  query_text text not null,
  category_id uuid references product_categories(id),
  city text not null,
  district text,
  latitude double precision,
  longitude double precision,
  status product_request_status not null default 'open',
  request_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type notification_type not null default 'info',
  is_read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

-- Audit logs
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

-- ===========================
-- INDEXES
-- ===========================

create index idx_profiles_role on profiles(role);
create index idx_businesses_owner on businesses(owner_id);
create index idx_shops_business on shops(business_id);
create index idx_shops_city on shops(city);
create index idx_shops_location on shops using gist(location);
create index idx_products_category on products(category_id);
create index idx_products_normalized on products using gin(normalized_name gin_trgm_ops);
create index idx_products_keywords on products using gin(search_keywords);
create index idx_inventory_product on inventory_items(product_id);
create index idx_inventory_shop on inventory_items(shop_id);
create index idx_inventory_available on inventory_items(is_available, quantity);
create index idx_orders_customer on orders(customer_id);
create index idx_orders_shop on orders(shop_id);
create index idx_orders_status on orders(status);
create index idx_reservations_customer on reservations(customer_id);
create index idx_reservations_shop on reservations(shop_id);
create index idx_reservations_status on reservations(status);
create index idx_demand_signals_product on demand_signals(product_id);
create index idx_demand_signals_city on demand_signals(city);
create index idx_demand_signals_created on demand_signals(created_at);
create index idx_notifications_user on notifications(user_id, is_read);
create index idx_audit_logs_user on audit_logs(user_id);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);

-- ===========================
-- FUNCTIONS
-- ===========================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Update inventory available quantity
create or replace function update_available_quantity()
returns trigger as $$
begin
  -- Trigger is just for reference; actual logic in application layer
  return new;
end;
$$ language plpgsql;

-- Update shop location geography on lat/lng change
create or replace function update_shop_location()
returns trigger as $$
begin
  new.location := ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326);
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger on_shop_location_change
  before update of latitude, longitude on shops
  for each row execute function update_shop_location();

-- Auto-update updated_at columns
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on profiles
  for each row execute function update_updated_at();

create trigger on_business_updated
  before update on businesses
  for each row execute function update_updated_at();

create trigger on_shop_updated
  before update on shops
  for each row execute function update_updated_at();

create trigger on_order_updated
  before update on orders
  for each row execute function update_updated_at();

create trigger on_product_request_updated
  before update on product_requests
  for each row execute function update_updated_at();

-- ===========================
-- ROW LEVEL SECURITY
-- ===========================

alter table profiles enable row level security;
alter table businesses enable row level security;
alter table shops enable row level security;
alter table products enable row level security;
alter table inventory_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reservations enable row level security;
alter table demand_signals enable row level security;
alter table product_requests enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table product_categories enable row level security;

-- Profiles: users can read own, sellers can read customers who ordered from them
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Sellers can view customer profiles for their orders"
  on profiles for select using (
    role = 'customer' and exists (
      select 1 from orders o
      join shops s on s.id = o.shop_id
      join businesses b on b.id = s.business_id
      where o.customer_id = profiles.id and b.owner_id = auth.uid()
    )
  );

create policy "Admins can view all profiles"
  on profiles for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Businesses: public read, owner write
create policy "Anyone can view verified businesses"
  on businesses for select using (is_verified = true or owner_id = auth.uid());

create policy "Business owners can manage their businesses"
  on businesses for all using (owner_id = auth.uid());

create policy "Admins can manage all businesses"
  on businesses for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Shops: public read, owner write
create policy "Anyone can view active shops"
  on shops for select using (is_active = true or exists (
    select 1 from businesses b where b.id = shops.business_id and b.owner_id = auth.uid()
  ));

create policy "Business owners can manage their shops"
  on shops for all using (
    exists (select 1 from businesses b where b.id = shops.business_id and b.owner_id = auth.uid())
  );

create policy "Admins can manage all shops"
  on shops for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Products: public read, anyone authenticated can insert
create policy "Anyone can view active products"
  on products for select using (is_active = true);

create policy "Authenticated users can create products"
  on products for insert with check (auth.role() = 'authenticated');

create policy "Admins can manage all products"
  on products for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Inventory: public read, shop owner write
create policy "Anyone can view inventory"
  on inventory_items for select using (true);

create policy "Shop owners can manage their inventory"
  on inventory_items for all using (
    exists (
      select 1 from shops s
      join businesses b on b.id = s.business_id
      where s.id = inventory_items.shop_id and b.owner_id = auth.uid()
    )
  );

create policy "Admins can manage all inventory"
  on inventory_items for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Orders: customer sees own, shop owner sees orders for their shops
create policy "Customers can view own orders"
  on orders for select using (customer_id = auth.uid());

create policy "Customers can create orders"
  on orders for insert with check (customer_id = auth.uid());

create policy "Shop owners can view and update orders for their shops"
  on orders for all using (
    exists (
      select 1 from shops s
      join businesses b on b.id = s.business_id
      where s.id = orders.shop_id and b.owner_id = auth.uid()
    )
  );

create policy "Admins can manage all orders"
  on orders for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Order items: linked to order access
create policy "Users can view order items for accessible orders"
  on order_items for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or exists (
        select 1 from shops s
        join businesses b on b.id = s.business_id
        where s.id = o.shop_id and b.owner_id = auth.uid()
      ))
    )
  );

create policy "Customers can create order items for own orders"
  on order_items for insert with check (
    exists (select 1 from orders o where o.id = order_items.order_id and o.customer_id = auth.uid())
  );

-- Reservations
create policy "Customers can view own reservations"
  on reservations for select using (customer_id = auth.uid());

create policy "Customers can create reservations"
  on reservations for insert with check (customer_id = auth.uid());

create policy "Shop owners can view and manage reservations for their shops"
  on reservations for all using (
    exists (
      select 1 from shops s
      join businesses b on b.id = s.business_id
      where s.id = reservations.shop_id and b.owner_id = auth.uid()
    )
  );

-- Demand signals: authenticated users can insert, sellers can view their area
create policy "Authenticated users can create demand signals"
  on demand_signals for insert with check (auth.role() = 'authenticated');

create policy "Sellers can view demand signals in their city"
  on demand_signals for select using (
    exists (
      select 1 from shops s
      join businesses b on b.id = s.business_id
      where s.city = demand_signals.city and b.owner_id = auth.uid()
    )
  );

create policy "Admins can view all demand signals"
  on demand_signals for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Product requests: public read, authenticated insert
create policy "Anyone can view product requests"
  on product_requests for select using (true);

create policy "Authenticated users can create product requests"
  on product_requests for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update request count"
  on product_requests for update using (auth.role() = 'authenticated');

create policy "Admins can manage product requests"
  on product_requests for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Notifications
create policy "Users can view own notifications"
  on notifications for select using (user_id = auth.uid());

create policy "Users can update own notifications"
  on notifications for update using (user_id = auth.uid());

create policy "System can create notifications"
  on notifications for insert with check (auth.role() = 'authenticated');

-- Audit logs: admin only
create policy "Admins can view all audit logs"
  on audit_logs for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "System can create audit logs"
  on audit_logs for insert with check (auth.role() = 'authenticated');

-- Categories: public read
create policy "Anyone can view categories"
  on product_categories for select using (true);

create policy "Admins can manage categories"
  on product_categories for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ===========================
-- SEED DATA: Categories
-- ===========================

insert into product_categories (name, slug, icon, sort_order) values
  ('Electronics', 'electronics', 'Cpu', 1),
  ('Hardware & Tools', 'hardware-tools', 'Wrench', 2),
  ('Construction Materials', 'construction', 'Building', 3),
  ('Home & Kitchen', 'home-kitchen', 'Home', 4),
  ('Agriculture & Farming', 'agriculture', 'Sprout', 5),
  ('Automotive', 'automotive', 'Car', 6),
  ('Clothing & Textiles', 'clothing', 'Shirt', 7),
  ('Food & Beverages', 'food-beverages', 'UtensilsCrossed', 8),
  ('Health & Beauty', 'health-beauty', 'Heart', 9),
  ('Office & Stationery', 'office-stationery', 'FileText', 10),
  ('Sports & Outdoors', 'sports-outdoors', 'Dumbbell', 11),
  ('Books & Education', 'books-education', 'BookOpen', 12),
  ('Raw Materials', 'raw-materials', 'Layers', 13),
  ('Industrial Equipment', 'industrial', 'Factory', 14),
  ('Furniture', 'furniture', 'Armchair', 15);

-- ===========================
-- VIEWS
-- ===========================

-- Stock availability view
create or replace view v_stock_availability as
select
  ii.id as inventory_item_id,
  ii.product_id,
  ii.shop_id,
  p.name as product_name,
  p.brand,
  p.model,
  p.normalized_name,
  s.name as shop_name,
  s.city,
  s.district,
  s.latitude,
  s.longitude,
  b.name as business_name,
  b.is_verified,
  b.trust_score,
  ii.quantity,
  ii.reserved_quantity,
  (ii.quantity - ii.reserved_quantity) as available_quantity,
  ii.price,
  ii.wholesale_price,
  ii.min_order_quantity,
  ii.last_updated,
  ii.is_available,
  case
    when ii.last_updated > now() - interval '30 minutes' then 'high'
    when ii.last_updated > now() - interval '4 hours' then 'medium'
    else 'low'
  end as stock_confidence
from inventory_items ii
join products p on p.id = ii.product_id
join shops s on s.id = ii.shop_id
join businesses b on b.id = s.business_id
where ii.is_available = true
  and s.is_active = true
  and b.is_verified = true;

-- Demand summary view
create or replace view v_demand_summary as
select
  ds.product_id,
  p.name as product_name,
  ds.city,
  count(*) as search_count,
  count(distinct ds.user_id) as unique_users,
  min(ds.created_at) as first_seen,
  max(ds.created_at) as last_seen,
  (
    select count(distinct ii.shop_id)
    from inventory_items ii
    join shops s on s.id = ii.shop_id
    where ii.product_id = ds.product_id
      and s.city = ds.city
      and ii.is_available = true
      and ii.quantity > 0
  ) as available_shops
from demand_signals ds
join products p on p.id = ds.product_id
where ds.created_at > now() - interval '7 days'
group by ds.product_id, p.name, ds.city;
