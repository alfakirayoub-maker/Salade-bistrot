-- Bistrot Salad Bar: menu managed from the /admin page.
--
-- Everyone (anon) can read the menu; only e-mails listed in public.admins,
-- signed in through Supabase Auth, can change it. Prices are integer MAD.

-- Admin allowlist ------------------------------------------------------------
create table public.admins (
  email text primary key check (email = lower(email) and position('@' in email) > 1),
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- Each signed-in user may only see whether they themselves are an admin.
create policy "admins: read own row" on public.admins
  for select to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

create function public.is_admin() returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Menu items -----------------------------------------------------------------
create type public.item_category as enum ('base', 'ingredient', 'topping', 'petitPlus', 'sauce');

create table public.menu_items (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(id) <= 48),
  category public.item_category not null,
  -- Toppings are grouped like on the printed menu; other categories have no group.
  group_id text check (group_id in ('viandes', 'poissons', 'volailles', 'fromages', 'fruits')),
  name_fr text not null check (length(btrim(name_fr)) between 1 and 60),
  name_ar text not null check (length(btrim(name_ar)) between 1 and 60),
  supplement integer not null default 0 check (supplement between 0 and 500),
  available boolean not null default true,
  -- Printed "selon disponibilité".
  seasonal boolean not null default false,
  sort_order integer not null default 0,
  -- Which prototype visual draws this item in the bowl (defaults to its id).
  visual text check (visual is null or visual ~ '^[a-z0-9-]+$'),
  updated_at timestamptz not null default now(),
  constraint topping_has_group check ((category = 'topping') = (group_id is not null))
);
create index menu_items_category_order on public.menu_items (category, sort_order);

alter table public.menu_items enable row level security;

create policy "menu: public read" on public.menu_items
  for select to anon, authenticated using (true);
create policy "menu: admins insert" on public.menu_items
  for insert to authenticated with check ((select public.is_admin()));
create policy "menu: admins update" on public.menu_items
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "menu: admins delete" on public.menu_items
  for delete to authenticated using ((select public.is_admin()));

create function public.touch_updated_at() returns trigger
  language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger menu_items_touch before update on public.menu_items
  for each row execute function public.touch_updated_at();

-- Seed: the official menu ("compo new", Nov 2026) -----------------------------
insert into public.menu_items (id, category, group_id, name_fr, name_ar, supplement, available, seasonal, sort_order) values
  ('ble-souffle', 'base', null, 'Blé soufflé', 'قمح منفوخ', 0, true, false, 10),
  ('laitue', 'base', null, 'Laitue', 'خس', 0, true, false, 20),
  ('pates-blanches', 'base', null, 'Pâtes blanches', 'معكرونة بيضاء', 0, true, false, 30),
  ('riz-blanc', 'base', null, 'Riz blanc', 'أرز أبيض', 0, true, false, 40),
  ('roquette', 'base', null, 'Roquette', 'جرجير', 15, true, false, 50),
  ('quinoa', 'base', null, 'Quinoa', 'كينوا', 10, true, false, 60),
  ('pates-completes', 'base', null, 'Pâtes complètes', 'معكرونة كاملة الحبوب', 10, true, false, 70),
  ('riz-brun', 'base', null, 'Riz brun', 'أرز بني', 10, true, false, 80),
  ('concombre', 'ingredient', null, 'Concombre', 'خيار', 0, true, false, 10),
  ('carottes', 'ingredient', null, 'Carottes', 'جزر', 0, true, false, 20),
  ('oignons', 'ingredient', null, 'Oignons', 'بصل', 0, true, false, 30),
  ('pomme-de-terre', 'ingredient', null, 'Pomme de terre', 'بطاطس', 0, true, false, 40),
  ('betterave', 'ingredient', null, 'Betterave', 'شمندر', 0, true, false, 50),
  ('poivron', 'ingredient', null, 'Poivron', 'فلفل حلو', 0, true, false, 60),
  ('tomates', 'ingredient', null, 'Tomates', 'طماطم', 0, true, false, 70),
  ('tomates-confites', 'ingredient', null, 'Tomates confites', 'طماطم كونفي', 0, true, false, 80),
  ('tomates-sechees', 'ingredient', null, 'Tomates séchées', 'طماطم مجففة', 0, true, false, 90),
  ('aubergines-grillees', 'ingredient', null, 'Aubergines grillées', 'باذنجان مشوي', 0, true, false, 100),
  ('courgettes-grillees', 'ingredient', null, 'Courgettes grillées', 'كوسة مشوية', 0, true, false, 110),
  ('chou-rouge', 'ingredient', null, 'Chou rouge', 'ملفوف أحمر', 0, true, false, 120),
  ('chou-blanc', 'ingredient', null, 'Chou blanc', 'ملفوف أبيض', 0, true, false, 130),
  ('champignons', 'ingredient', null, 'Champignons', 'فطر', 0, true, false, 140),
  ('mais', 'ingredient', null, 'Maïs', 'ذرة', 0, true, false, 150),
  ('coeur-de-palmier', 'ingredient', null, 'Cœur de palmier', 'قلب النخيل', 0, true, false, 160),
  ('noix', 'ingredient', null, 'Noix', 'جوز', 0, true, false, 170),
  ('cajou', 'ingredient', null, 'Noix de cajou', 'كاجو', 0, true, false, 180),
  ('cacahuetes', 'ingredient', null, 'Cacahuètes', 'فول سوداني', 0, true, false, 190),
  ('dattes', 'ingredient', null, 'Dattes', 'تمر', 0, true, false, 200),
  ('figues', 'ingredient', null, 'Figues', 'تين', 0, true, false, 210),
  ('raisins-secs', 'ingredient', null, 'Raisins secs', 'زبيب', 0, true, false, 220),
  ('oignons-crispy', 'ingredient', null, 'Oignons crispy', 'بصل مقرمش', 0, true, false, 230),
  ('cornichons', 'ingredient', null, 'Cornichons', 'خيار مخلل', 0, true, false, 240),
  ('olives', 'ingredient', null, 'Olives vertes / noires', 'زيتون أخضر / أسود', 0, true, false, 250),
  ('haricots-verts', 'ingredient', null, 'Haricots verts', 'فاصوليا خضراء', 0, true, true, 260),
  ('artichaut', 'ingredient', null, 'Artichaut', 'خرشوف', 0, true, true, 270),
  ('brocolis', 'ingredient', null, 'Brocolis', 'بروكلي', 0, true, true, 280),
  ('tomates-cerises', 'ingredient', null, 'Tomates cerises', 'طماطم كرزية', 0, true, true, 290),
  ('fenouil', 'ingredient', null, 'Fenouil', 'شمر', 0, true, true, 300),
  ('boeuf-roti', 'topping', 'viandes', 'Bœuf rôti', 'لحم بقري مشوي', 10, true, false, 10),
  ('charcuterie-boeuf', 'topping', 'viandes', 'Charcuterie de bœuf', 'شاركوتري بقري', 0, true, false, 20),
  ('saumon-fume', 'topping', 'poissons', 'Saumon fumé', 'سلمون مدخّن', 15, true, false, 30),
  ('anchois', 'topping', 'poissons', 'Anchois', 'أنشوفة', 10, true, false, 40),
  ('crevettes', 'topping', 'poissons', 'Crevettes', 'روبيان', 0, true, false, 50),
  ('thon', 'topping', 'poissons', 'Thon', 'تونة', 0, true, false, 60),
  ('calamars', 'topping', 'poissons', 'Calamars', 'كاليماري', 0, true, false, 70),
  ('surimi', 'topping', 'poissons', 'Surimi', 'سوريمي', 0, true, false, 80),
  ('poulet', 'topping', 'volailles', 'Poulet / Poulet grillé', 'دجاج / دجاج مشوي', 0, true, false, 90),
  ('charcuterie-poulet', 'topping', 'volailles', 'Charcuterie de poulet', 'شاركوتري الدجاج', 0, true, false, 100),
  ('oeufs-caille', 'topping', 'volailles', 'Œufs de caille', 'بيض السمّان', 0, true, false, 110),
  ('oeufs-fermiers', 'topping', 'volailles', 'Œufs fermiers', 'بيض بلدي', 0, true, false, 120),
  ('parmesan', 'topping', 'fromages', 'Parmesan', 'جبن بارميزان', 10, true, false, 130),
  ('edam', 'topping', 'fromages', 'Edam', 'جبن إيدام', 0, true, false, 140),
  ('gouda', 'topping', 'fromages', 'Gouda', 'جبن غودا', 0, true, false, 150),
  ('mozzarella-cerises', 'topping', 'fromages', 'Mozzarella cerises', 'موزاريلا صغيرة', 0, true, false, 160),
  ('feta', 'topping', 'fromages', 'Feta', 'جبن فيتا', 0, true, false, 170),
  ('chevre', 'topping', 'fromages', 'Fromage de chèvre', 'جبن الماعز', 0, true, false, 180),
  ('brie', 'topping', 'fromages', 'Brie', 'جبن بري', 0, true, false, 190),
  ('fromage-bleu', 'topping', 'fromages', 'Fromage bleu', 'جبن أزرق', 0, true, false, 200),
  ('avocat', 'topping', 'fruits', 'Avocat', 'أفوكادو', 5, true, true, 210),
  ('mangue', 'topping', 'fruits', 'Mangue', 'مانجو', 5, true, true, 220),
  ('ananas', 'topping', 'fruits', 'Ananas', 'أناناس', 0, true, true, 230),
  ('framboise', 'topping', 'fruits', 'Framboise', 'توت العليق', 0, true, true, 240),
  ('fraise', 'topping', 'fruits', 'Fraise', 'فراولة', 0, true, true, 250),
  ('poire', 'topping', 'fruits', 'Poire', 'إجاص', 0, true, true, 260),
  ('pomme', 'topping', 'fruits', 'Pomme', 'تفاح', 0, true, true, 270),
  ('peche', 'topping', 'fruits', 'Pêche', 'خوخ', 0, true, true, 280),
  ('orange', 'topping', 'fruits', 'Orange', 'برتقال', 0, true, true, 290),
  ('kiwi', 'topping', 'fruits', 'Kiwi', 'كيوي', 0, true, true, 300),
  ('plantes-aromatiques', 'petitPlus', null, 'Plantes aromatiques', 'أعشاب عطرية', 0, true, false, 10),
  ('lentilles', 'petitPlus', null, 'Lentilles', 'عدس', 0, true, false, 20),
  ('pois-chiches', 'petitPlus', null, 'Pois chiches', 'حمص', 0, true, false, 30),
  ('radis', 'petitPlus', null, 'Radis', 'فجل', 0, true, false, 40),
  ('chia', 'petitPlus', null, 'Chia', 'بذور الشيا', 0, true, false, 50),
  ('croutons-ail', 'petitPlus', null, 'Croûtons à l''ail', 'خبز محمّص بالثوم', 0, true, false, 60),
  ('multigraines', 'petitPlus', null, 'Multigraines', 'بذور متنوعة', 0, true, false, 70),
  ('baguettes-chips', 'petitPlus', null, 'Baguettes chips', 'رقائق الخبز', 0, true, false, 80),
  ('melange-sauces', 'sauce', null, 'Mélange sauces', 'مزيج الصلصات', 5, true, false, 10),
  ('sauce-healthy', 'sauce', null, 'Sauce Healthy', 'صلصة هيلثي', 5, true, false, 20),
  ('pesto', 'sauce', null, 'Sauce pesto', 'صلصة البيستو', 5, true, false, 30),
  ('sauce-asiatique', 'sauce', null, 'Sauce asiatique', 'صلصة آسيوية', 0, true, false, 40),
  ('vinaigrette', 'sauce', null, 'Vinaigrette', 'صلصة الفينيغريت', 0, true, false, 50),
  ('sauce-cesar', 'sauce', null, 'Sauce César', 'صلصة سيزر', 0, true, false, 60),
  ('sauce-cocktail', 'sauce', null, 'Sauce cocktail', 'صلصة كوكتيل', 0, true, false, 70),
  ('miel-moutarde', 'sauce', null, 'Miel & moutarde', 'عسل وخردل', 0, true, false, 80),
  ('sauce-balsamique', 'sauce', null, 'Sauce balsamique', 'صلصة البلسميك', 0, true, false, 90),
  ('salsa-verde', 'sauce', null, 'Salsa verde', 'سالسا فيردي', 0, true, false, 100)
on conflict (id) do nothing;

insert into public.admins (email) values ('alfakirayoub@gmail.com') on conflict do nothing;
