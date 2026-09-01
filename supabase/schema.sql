-- =====================================================================
-- SR FASO / SUPER & RESISTANT — Schéma initial
-- =====================================================================

-- Supabase installe les extensions dans le schéma "extensions" ; on l'ajoute
-- au search_path pour que similarity(), gin_trgm_ops et unaccent() soient
-- résolus quel que soit le schéma d'installation.
create schema if not exists extensions;
set search_path = public, extensions;

-- "if not exists" ne fait rien si l'extension est déjà installée dans
-- extensions (cas Supabase) ; sinon elle est créée dans public.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles (comptes back-office)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'admin' check (role in ('admin', 'editor')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'backoffice', 'false') = 'true' then
    insert into public.profiles (id, email, full_name, role)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'role', 'admin')
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  parent_id       uuid references public.categories(id) on delete set null,
  name            text not null,
  slug            text not null unique,
  description     text,
  seo_title       text,
  seo_description text,
  image_url       text,
  image_alt       text,
  icon            text,
  position        integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists categories_position_idx on public.categories(position);
drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  reference         text,
  category_id       uuid references public.categories(id) on delete set null,
  subcategory_id    uuid references public.categories(id) on delete set null,
  brand             text,
  price             numeric(12,2) not null default 0,
  old_price         numeric(12,2),
  short_description text,
  description       text,
  specifications    jsonb not null default '[]'::jsonb,
  compatibility     text[] not null default '{}',
  keywords          text[] not null default '{}',
  stock             integer not null default 0,
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  is_new            boolean not null default false,
  is_promo          boolean not null default false,
  views             integer not null default 0,
  sales_count       integer not null default 0,
  seo_title         text,
  seo_description   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- array_to_string() est STABLE et ne peut donc pas servir dans une colonne
-- générée : on passe par un wrapper déterministe déclaré IMMUTABLE.
create or replace function public.sr_array_text(arr text[])
returns text
language sql
immutable
parallel safe
as $$
  select coalesce(array_to_string(arr, ' '), '');
$$;

alter table public.products
  add column if not exists search_text text
  generated always as (
    coalesce(name, '') || ' ' ||
    coalesce(reference, '') || ' ' ||
    coalesce(brand, '') || ' ' ||
    coalesce(short_description, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    public.sr_array_text(compatibility) || ' ' ||
    public.sr_array_text(keywords)
  ) stored;

create index if not exists products_search_trgm_idx on public.products using gin (search_text gin_trgm_ops);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_idx on public.products(is_active);
create index if not exists products_brand_idx on public.products(brand);
create index if not exists products_price_idx on public.products(price);
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------
create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  alt         text,
  position    integer not null default 0,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id, position);

-- ---------------------------------------------------------------------
-- shops
-- ---------------------------------------------------------------------
create table if not exists public.shops (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  address     text,
  city        text,
  district    text,
  phone       text,
  whatsapp    text,
  hours       text,
  latitude    double precision,
  longitude   double precision,
  image_url   text,
  video_url   text,
  map_url     text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists shops_updated_at on public.shops;
create trigger shops_updated_at before update on public.shops
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- services (mécanique)
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  description text,
  details     text,
  price_label text,
  image_url   text,
  icon        text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- partner_brands (marques partenaires affichées sur l'accueil)
-- ---------------------------------------------------------------------
create table if not exists public.partner_brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  website_url text,
  is_primary  boolean not null default false,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists partner_brands_updated_at on public.partner_brands;
create trigger partner_brands_updated_at before update on public.partner_brands
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------
create table if not exists public.customers (
  id           uuid primary key default gen_random_uuid(),
  first_name   text,
  last_name    text,
  full_name    text,
  phone        text not null,
  email        text,
  city         text,
  district     text,
  user_id      uuid references auth.users(id) on delete set null,
  orders_count integer not null default 0,
  total_spent  numeric(14,2) not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists customers_phone_key on public.customers(phone);
create unique index if not exists customers_user_key
  on public.customers(user_id) where user_id is not null;
drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- orders / order_items
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  reference    text not null unique,
  customer_id  uuid references public.customers(id) on delete set null,
  user_id      uuid references auth.users(id) on delete set null,
  first_name   text not null,
  last_name    text not null,
  phone        text not null,
  email        text,
  city         text not null,
  district     text,
  notes        text,
  channel      text not null default 'site' check (channel in ('site', 'whatsapp')),
  status       text not null default 'nouvelle'
               check (status in ('nouvelle','confirmee','preparation','expediee','livree','annulee')),
  subtotal     numeric(14,2) not null default 0,
  delivery_fee numeric(14,2) not null default 0,
  total        numeric(14,2) not null default 0,
  admin_note   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text,
  image_url    text,
  unit_price   numeric(12,2) not null default 0,
  quantity     integer not null default 1,
  total        numeric(14,2) not null default 0
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------------------------------------------------------------------
-- contact_messages
-- ---------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null,
  email      text,
  subject    text,
  message    text not null,
  status     text not null default 'nouveau' check (status in ('nouveau','lu','traite')),
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_status_idx on public.contact_messages(status, created_at desc);

-- ---------------------------------------------------------------------
-- site_settings (ligne unique)
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  id                 smallint primary key default 1 check (id = 1),
  company_name       text not null default 'SUPER & RESISTANT',
  tagline            text,
  logo_url           text,
  favicon_url        text,
  phone_primary      text,
  phone_secondary    text,
  whatsapp           text,
  whatsapp_message   text,
  email              text,
  address            text,
  hours              text,
  delivery_title     text,
  delivery_text      text,
  facebook_url       text,
  tiktok_url         text,
  instagram_url      text,
  youtube_url        text,
  seo_title          text,
  seo_description    text,
  seo_keywords       text,
  og_image_url       text,
  home_hero_title    text,
  home_hero_subtitle text,
  home_hero_image    text,
  home_hero_video    text,
  home_hero_bg       text not null default 'brand'
                       check (home_hero_bg in ('brand', 'dark')),
  home_hero_tiles    jsonb not null default '[]'::jsonb,
  home_brands_title  text,
  home_brands_intro  text,
  home_seo_content   text,
  updated_at         timestamptz not null default now()
);
drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- delivery_content (ligne unique)
-- ---------------------------------------------------------------------
create table if not exists public.delivery_content (
  id              smallint primary key default 1 check (id = 1),
  delivery_title  text,
  delivery_body   text,
  return_title    text,
  return_body     text,
  seo_title       text,
  seo_description text,
  updated_at      timestamptz not null default now()
);
drop trigger if exists delivery_content_updated_at on public.delivery_content;
create trigger delivery_content_updated_at before update on public.delivery_content
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.shops            enable row level security;
alter table public.services         enable row level security;
alter table public.partner_brands   enable row level security;
alter table public.customers        enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings    enable row level security;
alter table public.delivery_content enable row level security;

-- profiles : chacun voit son profil, les admins voient tout
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Lecture publique du contenu actif
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (is_active or public.is_admin());
drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (is_active or public.is_admin());
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read on public.product_images
  for select using (true);
drop policy if exists product_images_admin_all on public.product_images;
create policy product_images_admin_all on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists shops_public_read on public.shops;
create policy shops_public_read on public.shops
  for select using (is_active or public.is_admin());
drop policy if exists shops_admin_all on public.shops;
create policy shops_admin_all on public.shops
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services
  for select using (is_active or public.is_admin());
drop policy if exists services_admin_all on public.services;
create policy services_admin_all on public.services
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists partner_brands_public_read on public.partner_brands;
create policy partner_brands_public_read on public.partner_brands
  for select using (is_active or public.is_admin());
drop policy if exists partner_brands_admin_all on public.partner_brands;
create policy partner_brands_admin_all on public.partner_brands
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings
  for select using (true);
drop policy if exists site_settings_admin_all on public.site_settings;
create policy site_settings_admin_all on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists delivery_content_public_read on public.delivery_content;
create policy delivery_content_public_read on public.delivery_content
  for select using (true);
drop policy if exists delivery_content_admin_all on public.delivery_content;
create policy delivery_content_admin_all on public.delivery_content
  for all using (public.is_admin()) with check (public.is_admin());

-- Données privées : réservées au back-office.
-- Les commandes et messages du public sont écrits côté serveur (service role),
-- aucune écriture anonyme n'est donc autorisée ici.
drop policy if exists customers_admin_all on public.customers;
create policy customers_admin_all on public.customers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_admin_all on public.order_items;
create policy order_items_admin_all on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- Compte client : chacun lit ses propres commandes.
drop policy if exists customers_own_read on public.customers;
create policy customers_own_read on public.customers
  for select using (user_id is not null and user_id = auth.uid());

drop policy if exists orders_own_read on public.orders;
create policy orders_own_read on public.orders
  for select using (user_id is not null and user_id = auth.uid());

drop policy if exists order_items_own_read on public.order_items;
create policy order_items_own_read on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id is not null
        and o.user_id = auth.uid()
    )
  );

drop policy if exists contact_messages_admin_all on public.contact_messages;
create policy contact_messages_admin_all on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Storage
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists media_admin_write on storage.objects;
create policy media_admin_write on storage.objects
  for insert with check (bucket_id = 'media' and public.is_admin());

drop policy if exists media_admin_update on storage.objects;
create policy media_admin_update on storage.objects
  for update using (bucket_id = 'media' and public.is_admin());

drop policy if exists media_admin_delete on storage.objects;
create policy media_admin_delete on storage.objects
  for delete using (bucket_id = 'media' and public.is_admin());

set search_path = public, extensions;

-- =====================================================================
-- Fonctions métier : recherche, référence de commande, statistiques
-- =====================================================================

-- ---------------------------------------------------------------------
-- Recherche produits tolérante (nom, référence, marque, description,
-- compatibilité, mots-clés, catégorie) — insensible aux accents.
-- ---------------------------------------------------------------------
create or replace function public.search_products(
  q text,
  max_results integer default 20
)
returns table (
  id                uuid,
  name              text,
  slug              text,
  reference         text,
  brand             text,
  price             numeric,
  old_price         numeric,
  stock             integer,
  category_name     text,
  category_slug     text,
  image_url         text,
  score             real
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with needle as (
    select unaccent(lower(trim(coalesce(q, '')))) as term
  )
  select
    p.id,
    p.name,
    p.slug,
    p.reference,
    p.brand,
    p.price,
    p.old_price,
    p.stock,
    c.name as category_name,
    c.slug as category_slug,
    (
      select pi.url from public.product_images pi
      where pi.product_id = p.id
      order by pi.is_primary desc, pi.position asc
      limit 1
    ) as image_url,
    greatest(
      similarity(unaccent(lower(p.name)), n.term),
      similarity(unaccent(lower(coalesce(p.search_text, ''))), n.term) * 0.8,
      case when unaccent(lower(coalesce(p.search_text, ''))) like '%' || n.term || '%'
           then 0.65 else 0 end,
      case when unaccent(lower(coalesce(c.name, ''))) like '%' || n.term || '%'
           then 0.6 else 0 end
    )::real as score
  from public.products p
  left join public.categories c on c.id = p.category_id
  cross join needle n
  where p.is_active
    and n.term <> ''
    and (
      unaccent(lower(coalesce(p.search_text, ''))) like '%' || n.term || '%'
      or unaccent(lower(coalesce(c.name, ''))) like '%' || n.term || '%'
      or similarity(unaccent(lower(coalesce(p.search_text, ''))), n.term) > 0.18
    )
  order by score desc, p.is_featured desc, p.sales_count desc
  limit greatest(1, least(coalesce(max_results, 20), 100));
$$;

grant execute on function public.search_products(text, integer) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Référence de commande lisible : SR-YYMM-XXXX
-- ---------------------------------------------------------------------
create sequence if not exists public.order_reference_seq start 1;

create or replace function public.next_order_reference()
returns text
language sql
volatile
security definer
set search_path = public, extensions
as $$
  select 'SR-' || to_char(now(), 'YYMM') || '-' ||
         lpad((nextval('public.order_reference_seq') % 10000)::text, 4, '0');
$$;

-- ---------------------------------------------------------------------
-- Statistiques du tableau de bord
-- ---------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns json
language sql
stable
security definer
set search_path = public, extensions
as $$
  select case when public.is_admin() then json_build_object(
    'products_total',    (select count(*) from public.products),
    'products_active',   (select count(*) from public.products where is_active),
    'products_out',      (select count(*) from public.products where stock <= 0),
    'categories_total',  (select count(*) from public.categories),
    'orders_total',      (select count(*) from public.orders),
    'orders_new',        (select count(*) from public.orders where status = 'nouvelle'),
    'orders_revenue',    (select coalesce(sum(total), 0) from public.orders where status = 'livree'),
    'customers_total',   (select count(*) from public.customers),
    'messages_new',      (select count(*) from public.contact_messages where status = 'nouveau'),
    'shops_total',       (select count(*) from public.shops),
    'services_total',    (select count(*) from public.services)
  ) else null end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;

-- ---------------------------------------------------------------------
-- Compteur de vues produit (non bloquant, public)
-- ---------------------------------------------------------------------
create or replace function public.increment_product_views(product_slug text)
returns void
language sql
volatile
security definer
set search_path = public, extensions
as $$
  update public.products set views = views + 1 where slug = product_slug and is_active;
$$;

grant execute on function public.increment_product_views(text) to anon, authenticated;

-- =====================================================================
-- Données de base : paramètres, catégories, boutiques, services, contenus
-- Idempotent — rejouable sans écraser les modifications du back-office
-- (les insert utilisent "on conflict do nothing" sur le slug / l'id).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Paramètres généraux
-- ---------------------------------------------------------------------
insert into public.site_settings (
  id, company_name, tagline, phone_primary, phone_secondary, whatsapp,
  whatsapp_message, email, address, hours,
  delivery_title, delivery_text,
  seo_title, seo_description, seo_keywords,
  home_hero_title, home_hero_subtitle, home_seo_content
) values (
  1,
  'SUPER & RESISTANT',
  'Pièces détachées, accessoires et mécanique moto au Burkina Faso',
  '+226 60 00 22 20',
  '+226 78 47 40 44',
  '+22660002220',
  'Bonjour SUPER & RESISTANT, je souhaite avoir des informations concernant ',
  'contact@srfaso.com',
  'Rue 7.07, Samandin, Ouagadougou',
  'Lundi – Samedi : 07h30 – 19h00',
  'Livraison',
  'Partout au Faso',
  'Pièces détachées moto au Burkina Faso | SR Faso',
  'SUPER & RESISTANT (SR Faso) : pièces détachées moto, accessoires et services de mécanique à Ouagadougou, Bobo-Dioulasso et partout au Burkina Faso. Livraison rapide et conseils d''experts.',
  'pièces détachées moto Burkina Faso, pièces moto Ouagadougou, accessoires moto Ouagadougou, batterie moto Ouagadougou, huile moto Burkina Faso, mécanique moto Ouagadougou',
  'Toutes les pièces de votre moto, au même endroit',
  'Moteur, transmission, électricité, éclairage, pneus, huiles et accessoires. Disponibles en boutique à Ouagadougou et livrés partout au Burkina Faso.',
  'SUPER & RESISTANT est un spécialiste des pièces détachées et accessoires moto installé à Ouagadougou. Notre catalogue couvre les principales familles de pièces : moteur, transmission, embrayage, électricité, éclairage, compteurs, injection, refroidissement, freinage, pneus et roues, huiles et lubrifiants. Nos équipes conseillent chaque jour des particuliers, des mécaniciens et des flottes de motos-taxis sur le choix des références compatibles avec leur machine. Nos deux boutiques de Ouagadougou — Rue 7.07 à Samandin et le Marché du cycle — accueillent les clients pour l''achat de pièces et les prestations d''atelier, et nous livrons les commandes à Ouagadougou, à Bobo-Dioulasso et dans les autres villes du Burkina Faso.'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Contenu Livraison & Retour
-- ---------------------------------------------------------------------
insert into public.delivery_content (
  id, delivery_title, delivery_body, return_title, return_body,
  seo_title, seo_description
) values (
  1,
  'Livraison',
  E'## Zones desservies\n\nNous livrons à Ouagadougou, à Bobo-Dioulasso et dans les autres villes du Burkina Faso via nos partenaires de transport.\n\n## Délais\n\n- Ouagadougou : livraison le jour même ou sous 24 heures pour toute commande validée avant 16h.\n- Autres villes du Burkina Faso : 24 à 72 heures selon la destination et la compagnie de transport.\n\n## Coût\n\nLes frais de livraison dépendent de la zone et du volume de la commande. Ils vous sont communiqués par téléphone ou sur WhatsApp au moment de la confirmation de la commande.\n\n## Modes de livraison\n\n- Retrait gratuit dans l''une de nos deux boutiques de Ouagadougou.\n- Livraison à domicile ou au lieu de travail à Ouagadougou.\n- Expédition par compagnie de transport vers les autres villes.\n\n## Réception\n\nVérifiez la conformité et l''état des pièces au moment de la réception, en présence du livreur.',
  'Retour & échange',
  E'## Conditions\n\nUne pièce peut être reprise ou échangée si elle n''a pas été montée, qu''elle est dans son emballage d''origine et accompagnée du reçu d''achat.\n\n## Délais\n\nLa demande doit nous parvenir dans un délai de 7 jours après la réception de la commande.\n\n## État attendu du produit\n\nLe produit doit être complet, non installé, non modifié et sans trace d''utilisation.\n\n## Procédure\n\n1. Contactez-nous par téléphone ou sur WhatsApp en indiquant votre numéro de commande.\n2. Rapportez la pièce en boutique ou convenez d''un enlèvement avec notre équipe.\n3. Après contrôle, nous procédons à l''échange ou à l''avoir.\n\n## Exclusions\n\nLes huiles et lubrifiants ouverts, les pièces électriques montées et les articles commandés spécialement à la demande du client ne sont pas repris.',
  'Livraison et retour — SR Faso',
  'Zones desservies, délais, coûts et procédure de retour pour vos commandes de pièces moto chez SUPER & RESISTANT au Burkina Faso.'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Catégories principales
-- ---------------------------------------------------------------------
insert into public.categories (name, slug, icon, position, description, seo_title, seo_description)
values
  ('Éclairage', 'eclairage', 'lightbulb', 10,
   'Phares, feux arrière, clignotants et ampoules pour toutes les motos.',
   'Éclairage moto au Burkina Faso — phares, feux et ampoules',
   'Phares, feux arrière, clignotants et ampoules moto disponibles à Ouagadougou et livrés partout au Burkina Faso.'),
  ('Électrique', 'electrique', 'battery-charging', 20,
   'Batteries, régulateurs, bobines, faisceaux et pièces électriques.',
   'Pièces électriques moto — batteries et faisceaux | SR Faso',
   'Batteries moto, régulateurs, bobines et faisceaux électriques en stock à Ouagadougou. Livraison au Burkina Faso.'),
  ('Moteur et Moto', 'moteur-et-moto', 'cog', 30,
   'Cylindres, pistons, culasses, soupapes et pièces moteur.',
   'Pièces moteur moto au Burkina Faso | SR Faso',
   'Cylindres, pistons, culasses et pièces moteur pour motos, disponibles à Ouagadougou et livrés dans tout le Burkina Faso.'),
  ('Compteurs', 'compteurs', 'gauge', 40,
   'Compteurs de vitesse, câbles et instruments de bord.',
   'Compteurs moto — vitesse et instruments | SR Faso',
   'Compteurs de vitesse, câbles et instruments de bord pour moto à Ouagadougou.'),
  ('Transmission', 'transmission', 'settings-2', 50,
   'Chaînes, couronnes, pignons et kits de transmission.',
   'Transmission moto — chaînes, couronnes et pignons | SR Faso',
   'Kits chaîne, couronnes et pignons pour moto disponibles au Burkina Faso.'),
  ('Injection', 'injection', 'fuel', 60,
   'Carburateurs, injecteurs, pompes et circuits de carburant.',
   'Injection et carburation moto | SR Faso',
   'Carburateurs, injecteurs et pompes à essence pour moto à Ouagadougou et au Burkina Faso.'),
  ('Accessoires', 'accessoires', 'briefcase', 70,
   'Rétroviseurs, protections, supports, casques et équipements.',
   'Accessoires moto Ouagadougou | SR Faso',
   'Rétroviseurs, protections, supports téléphone et équipements moto disponibles à Ouagadougou.'),
  ('Embrayage', 'embrayage', 'disc', 80,
   'Disques, ressorts, câbles et kits d''embrayage.',
   'Embrayage moto — disques et kits | SR Faso',
   'Disques, ressorts et câbles d''embrayage pour moto au Burkina Faso.'),
  ('Refroidissement', 'refroidissement', 'fan', 90,
   'Radiateurs, ventilateurs, durites et liquides de refroidissement.',
   'Refroidissement moto — radiateurs et ventilateurs | SR Faso',
   'Radiateurs, ventilateurs et durites de refroidissement moto disponibles à Ouagadougou.'),
  ('Huiles & Lubrifiants', 'huiles-lubrifiants', 'droplets', 100,
   'Huiles moteur, huiles de fourche, graisses et additifs.',
   'Huile moto Burkina Faso — moteur et lubrifiants | SR Faso',
   'Huiles moteur, huiles de fourche et graisses pour moto, disponibles à Ouagadougou et livrées au Burkina Faso.'),
  ('Pneus & Roues', 'pneus-roues', 'circle-dot', 110,
   'Pneus, chambres à air, jantes et rayons.',
   'Pneus moto au Burkina Faso — pneus, chambres et jantes | SR Faso',
   'Pneus moto, chambres à air et jantes disponibles à Ouagadougou et livrés partout au Burkina Faso.'),
  ('Freinage', 'freinage', 'octagon-alert', 120,
   'Plaquettes, mâchoires, disques, câbles et liquides de frein.',
   'Freinage moto — plaquettes et disques | SR Faso',
   'Plaquettes, mâchoires et disques de frein moto disponibles à Ouagadougou.')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Boutiques
-- ---------------------------------------------------------------------
insert into public.shops (name, slug, address, city, district, phone, whatsapp, hours, position, description)
values
  ('Boutique Principale', 'boutique-principale', 'Rue 7.07, Samandin, Ouagadougou',
   'Ouagadougou', 'Samandin', '+226 60 00 22 20', '+22660002220',
   'Lundi – Samedi : 07h30 – 19h00', 10,
   'Notre boutique principale, avec le stock le plus complet de pièces détachées et d''accessoires moto.'),
  ('Boutique Secondaire', 'boutique-secondaire', 'Marché du cycle, Ouagadougou',
   'Ouagadougou', 'Marché du cycle', '+226 78 47 40 44', '+22678474044',
   'Lundi – Samedi : 07h30 – 19h00', 20,
   'Au cœur du Marché du cycle, pour trouver rapidement les pièces d''usage courant.')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Services mécaniques
-- ---------------------------------------------------------------------
insert into public.services (title, slug, description, details, icon, position)
values
  ('Diagnostic', 'diagnostic',
   'Identification de la panne avant toute intervention.',
   'Nos mécaniciens contrôlent le moteur, l''allumage, la transmission et le circuit électrique afin d''identifier précisément l''origine de la panne et de vous proposer une réparation adaptée.',
   'stethoscope', 10),
  ('Réparation moteur', 'reparation-moteur',
   'Réfection et remise en état du moteur.',
   'Démontage, contrôle des jeux, remplacement des cylindres, pistons, segments et joints, puis remontage et essai.',
   'cog', 20),
  ('Transmission', 'transmission',
   'Chaîne, couronne, pignon et réglages.',
   'Remplacement des kits chaîne, réglage de la tension et contrôle de l''alignement pour une transmission silencieuse et durable.',
   'settings-2', 30),
  ('Embrayage', 'embrayage',
   'Remplacement et réglage de l''embrayage.',
   'Changement des disques et ressorts, réglage du câble et contrôle du patinage.',
   'disc', 40),
  ('Électricité', 'electricite',
   'Batterie, faisceau, démarrage et éclairage.',
   'Diagnostic du circuit de charge, remplacement de la batterie, réparation du faisceau, du démarreur et de l''éclairage.',
   'battery-charging', 50),
  ('Freinage', 'freinage',
   'Contrôle et remise en état du système de freinage.',
   'Remplacement des plaquettes et mâchoires, contrôle des disques, purge et réglage.',
   'octagon-alert', 60),
  ('Entretien', 'entretien',
   'Vidange, filtres et révision périodique.',
   'Vidange moteur, remplacement des filtres, contrôle des niveaux, du jeu aux soupapes et des points de sécurité.',
   'wrench', 70)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Marques partenaires
-- ---------------------------------------------------------------------
insert into public.partner_brands (name, slug, logo_url, is_primary, position)
values
  ('Kawasaki', 'kawasaki', '/brands/kawasaki.png', false, 10),
  ('SUPER & RESISTANT', 'super-resistant', '/srfaso.png', true, 20),
  ('Honda', 'honda', '/brands/honda.png', false, 30),
  ('Suzuki', 'suzuki', '/brands/suzuki.png', false, 40),
  ('Yamaha', 'yamaha', '/brands/yamaha.png', false, 50)
on conflict (slug) do nothing;
