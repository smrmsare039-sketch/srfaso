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
