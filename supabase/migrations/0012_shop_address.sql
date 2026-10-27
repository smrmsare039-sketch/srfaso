set search_path = public, extensions;

-- =====================================================================
-- Nouvelle adresse de la boutique principale
--   Ne remplace que l'adresse d'origine : une adresse déjà modifiée
--   au back-office est conservée.
-- =====================================================================
update public.site_settings
  set address = 'Marché de cycles /Theatre populaire'
  where address = 'Rue 7.07, Samandin, Ouagadougou';

update public.shops
  set address = 'Marché de cycles /Theatre populaire'
  where slug = 'boutique-principale'
    and address = 'Rue 7.07, Samandin, Ouagadougou';
