set search_path = public, extensions;

-- =====================================================================
-- Bannière d'accueil : fond de couleur et vidéo
--   home_hero_bg    : 'brand' (rouge, défaut) ou 'dark' (noir)
--   home_hero_video : vidéo MP4/WebM affichée à la place de l'image
-- =====================================================================
alter table public.site_settings
  add column if not exists home_hero_video text,
  add column if not exists home_hero_bg text not null default 'brand';

update public.site_settings set home_hero_bg = 'brand'
where home_hero_bg is null or home_hero_bg not in ('brand', 'dark');

alter table public.site_settings drop constraint if exists site_settings_home_hero_bg_check;
alter table public.site_settings
  add constraint site_settings_home_hero_bg_check check (home_hero_bg in ('brand', 'dark'));
