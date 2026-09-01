set search_path = public, extensions;

-- =====================================================================
-- Vidéo de fond des cartes boutiques (page /boutiques)
-- =====================================================================
alter table public.shops
  add column if not exists video_url text;
