set search_path = public, extensions;

-- =====================================================================
-- Mosaïque de la bannière d'accueil (4 visuels gérés au back-office)
-- Chaque entrée : { "url": text, "label": text, "href": text }
-- =====================================================================
alter table public.site_settings
  add column if not exists home_hero_tiles jsonb not null default '[]'::jsonb;
