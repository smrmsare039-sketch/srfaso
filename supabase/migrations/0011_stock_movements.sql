-- ---------------------------------------------------------------------
-- Mouvements de stock liés aux commandes
--
-- Le stock était lu à la commande mais jamais mis à jour : deux clients
-- pouvaient acheter la même dernière pièce. Les deux fonctions ci-dessous
-- appliquent tous les mouvements d'une commande en une seule instruction,
-- donc de façon atomique.
-- ---------------------------------------------------------------------

/**
 * p_items : [{ "product_id": "<uuid>", "quantity": 2 }, ...]
 * Le stock ne descend jamais sous zéro (vente au comptoir non enregistrée,
 * inventaire décalé : mieux vaut zéro qu'une valeur négative).
 */
create or replace function public.decrement_stock(p_items jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products p
     set stock = greatest(0, p.stock - x.quantity),
         sales_count = p.sales_count + x.quantity
    from (
      select (e->>'product_id')::uuid as id,
             (e->>'quantity')::integer as quantity
        from jsonb_array_elements(p_items) e
       where e->>'product_id' is not null
    ) x
   where p.id = x.id;
$$;

/** Remise en stock : annulation ou suppression d'une commande. */
create or replace function public.increment_stock(p_items jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products p
     set stock = p.stock + x.quantity,
         sales_count = greatest(0, p.sales_count - x.quantity)
    from (
      select (e->>'product_id')::uuid as id,
             (e->>'quantity')::integer as quantity
        from jsonb_array_elements(p_items) e
       where e->>'product_id' is not null
    ) x
   where p.id = x.id;
$$;

revoke all on function public.decrement_stock(jsonb) from public, anon, authenticated;
revoke all on function public.increment_stock(jsonb) from public, anon, authenticated;

-- Marque le stock déjà décompté, pour ne jamais le rendre deux fois
-- (annulation puis suppression de la même commande, par exemple).
alter table public.orders
  add column if not exists stock_applied boolean not null default false;
