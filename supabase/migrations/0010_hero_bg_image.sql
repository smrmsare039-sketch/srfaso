set search_path = public, extensions;

-- =====================================================================
-- Bannière d'accueil : image de fond
--   home_hero_bg          accepte désormais 'image'
--   home_hero_bg_image    photo affichée en fond de la bannière
-- =====================================================================
alter table public.site_settings
  add column if not exists home_hero_bg_image text;

alter table public.site_settings drop constraint if exists site_settings_home_hero_bg_check;
alter table public.site_settings
  add constraint site_settings_home_hero_bg_check
  check (home_hero_bg in ('brand', 'dark', 'image'));
