set search_path = public, extensions;

-- =====================================================================
-- home_promo (ligne unique) — section « offre du moment » de l'accueil
-- product_ids : produits mis en avant sous la bannière (uuid, ordre gardé)
-- =====================================================================
create table if not exists public.home_promo (
  id           smallint primary key default 1 check (id = 1),
  is_active    boolean not null default false,
  eyebrow      text,
  title        text,
  description  text,
  image_url    text,
  cta_label    text,
  cta_href     text,
  ends_at      timestamptz,
  product_ids  jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

drop trigger if exists home_promo_updated_at on public.home_promo;
create trigger home_promo_updated_at before update on public.home_promo
  for each row execute function public.set_updated_at();

alter table public.home_promo enable row level security;

drop policy if exists home_promo_public_read on public.home_promo;
create policy home_promo_public_read on public.home_promo
  for select using (true);

drop policy if exists home_promo_admin_all on public.home_promo;
create policy home_promo_admin_all on public.home_promo
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.home_promo (id) values (1) on conflict (id) do nothing;
