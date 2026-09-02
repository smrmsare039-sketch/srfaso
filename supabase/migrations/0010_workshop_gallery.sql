set search_path = public, extensions;

-- =====================================================================
-- workshop_gallery — photos de l'atelier affichées sur /mecanique
--   before_url : photo « avant » facultative (comparatif avant / après)
--   service_id : prestation associée (filtre + message WhatsApp pré-rempli)
-- =====================================================================
create table if not exists public.workshop_gallery (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  caption    text,
  image_url  text not null,
  before_url text,
  service_id uuid references public.services(id) on delete set null,
  position   integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workshop_gallery_position_idx
  on public.workshop_gallery (position, created_at);

drop trigger if exists workshop_gallery_updated_at on public.workshop_gallery;
create trigger workshop_gallery_updated_at before update on public.workshop_gallery
  for each row execute function public.set_updated_at();

alter table public.workshop_gallery enable row level security;

drop policy if exists workshop_gallery_public_read on public.workshop_gallery;
create policy workshop_gallery_public_read on public.workshop_gallery
  for select using (is_active or public.is_admin());
drop policy if exists workshop_gallery_admin_all on public.workshop_gallery;
create policy workshop_gallery_admin_all on public.workshop_gallery
  for all using (public.is_admin()) with check (public.is_admin());
