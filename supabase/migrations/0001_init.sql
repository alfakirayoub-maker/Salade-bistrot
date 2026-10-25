-- DRAFT schema for Phase 5 (not applied yet). Prices are integer MAD.
-- Public (anon) users can only read the active menu and insert orders through
-- a server route that re-prices them; staff manage everything else.

create table restaurant_settings (
  id boolean primary key default true check (id), -- single row
  whatsapp_number text not null default '+212691322455',
  address_fr text, address_ar text,
  logo_path text, hero_path text,
  stack_premium_on_extra_slot boolean not null default true,
  updated_at timestamptz not null default now()
);

create table formulas (
  id text primary key,
  name_fr text not null, name_ar text not null,
  price integer not null check (price >= 0),
  accent text,
  sort_order integer not null default 0,
  active boolean not null default true
);

create type item_category as enum ('base', 'ingredient', 'topping', 'petitPlus', 'sauce');

-- Allowance per formula & category; null = not stated on the menu (provisional applies).
create table formula_rules (
  formula_id text references formulas(id) on delete cascade,
  category item_category not null,
  included integer check (included >= 0),
  provisional_included integer,
  primary key (formula_id, category)
);

-- Extra-slot fee per category; null = going over the allowance is not allowed.
create table pricing_rules (
  category item_category primary key,
  extra_slot_fee integer check (extra_slot_fee >= 0),
  minimum integer not null default 0
);

create table categories (
  id text primary key, -- topping groups: viandes, poissons, …
  category item_category not null,
  name_fr text not null, name_ar text not null,
  sort_order integer not null default 0
);

create table ingredients (
  id text primary key,
  category item_category not null,
  group_id text references categories(id),
  supplement integer not null default 0 check (supplement >= 0),
  available boolean not null default true,
  seasonal boolean not null default false,
  sort_order integer not null default 0
);

create table ingredient_translations (
  ingredient_id text references ingredients(id) on delete cascade,
  locale text not null check (locale in ('fr', 'ar')),
  name text not null,
  primary key (ingredient_id, locale)
);

-- Visual pipeline (see docs/ASSETS.md); storage paths in the "ingredients" bucket.
create table ingredient_assets (
  ingredient_id text primary key references ingredients(id) on delete cascade,
  image_paths text[] not null default '{}',
  piece_count integer, piece_size real, layer integer,
  distribution text check (distribution in ('scatter', 'cluster'))
);

create type order_status as enum ('new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');

create table orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  customer_phone text,
  mode text not null check (mode in ('pickup', 'delivery')),
  address text, notes text,
  locale text not null default 'fr',
  total integer not null, -- computed server-side
  status order_status not null default 'new'
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  formula_id text not null references formulas(id),
  name text,
  quantity integer not null check (quantity between 1 and 20),
  unit_price integer not null
);

create table order_item_selections (
  order_item_id uuid references order_items(id) on delete cascade,
  ingredient_id text references ingredients(id),
  category item_category not null,
  position integer not null,
  primary key (order_item_id, ingredient_id)
);

-- Staff membership (linked to Supabase Auth users).
create table staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('staff', 'admin'))
);

create function is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid());
$$;

-- Row Level Security -------------------------------------------------------
alter table restaurant_settings enable row level security;
alter table formulas enable row level security;
alter table formula_rules enable row level security;
alter table pricing_rules enable row level security;
alter table categories enable row level security;
alter table ingredients enable row level security;
alter table ingredient_translations enable row level security;
alter table ingredient_assets enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_selections enable row level security;
alter table staff enable row level security;

-- Menu: public read, staff write.
do $$
declare t text;
begin
  foreach t in array array['restaurant_settings','formulas','formula_rules','pricing_rules','categories',
                           'ingredients','ingredient_translations','ingredient_assets'] loop
    execute format('create policy "public read" on %I for select using (true)', t);
    execute format('create policy "staff write" on %I for all using (is_staff()) with check (is_staff())', t);
  end loop;
end $$;

-- Orders: no anon access at all. Orders are inserted by a server route using the
-- service role after re-pricing; staff read and update them.
create policy "staff read orders" on orders for select using (is_staff());
create policy "staff update orders" on orders for update using (is_staff()) with check (is_staff());
create policy "staff read order items" on order_items for select using (is_staff());
create policy "staff read selections" on order_item_selections for select using (is_staff());
create policy "staff read own membership" on staff for select using (user_id = auth.uid());
