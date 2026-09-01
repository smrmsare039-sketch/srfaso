set search_path = public, extensions;

-- =====================================================================
-- Marques partenaires affichées sur la page d'accueil
-- (gérées au back-office : /admin/marques)
-- =====================================================================
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

alter table public.partner_brands enable row level security;

drop policy if exists partner_brands_public_read on public.partner_brands;
create policy partner_brands_public_read on public.partner_brands
  for select using (is_active or public.is_admin());
drop policy if exists partner_brands_admin_all on public.partner_brands;
create policy partner_brands_admin_all on public.partner_brands
  for all using (public.is_admin()) with check (public.is_admin());

-- Titre et texte d'introduction de la section « Nos marques partenaires »
alter table public.site_settings
  add column if not exists home_brands_title text,
  add column if not exists home_brands_intro text;

update public.site_settings
set home_brands_title = coalesce(home_brands_title,
      'Nos marques partenaires — avec SUPER & RESISTANT en référence'),
    home_brands_intro = coalesce(home_brands_intro,
      'Nous sélectionnons des marques reconnues pour leur fiabilité et leurs performances afin de garantir des pièces moto durables et adaptées aux réalités du terrain. SUPER & RESISTANT, notre marque principale, incarne cet engagement avec des produits robustes, testés et pensés pour les motards exigeants. À ses côtés, nous proposons également des références majeures du marché comme Honda, Suzuki et Yamaha pour offrir un choix complet, sûr et professionnel.')
where id = 1;

insert into public.partner_brands (name, slug, logo_url, is_primary, position)
values
  ('Kawasaki', 'kawasaki', '/brands/kawasaki.png', false, 10),
  ('SUPER & RESISTANT', 'super-resistant', '/srfaso.png', true, 20),
  ('Honda', 'honda', '/brands/honda.png', false, 30),
  ('Suzuki', 'suzuki', '/brands/suzuki.png', false, 40),
  ('Yamaha', 'yamaha', '/brands/yamaha.png', false, 50)
on conflict (slug) do nothing;
