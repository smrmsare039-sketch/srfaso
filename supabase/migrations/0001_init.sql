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
  orders_count integer not null default 0,
  total_spent  numeric(14,2) not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists customers_phone_key on public.customers(phone);
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
