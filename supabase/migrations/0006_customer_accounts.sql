-- ---------------------------------------------------------------------
-- Comptes clients : rattachement des commandes à un utilisateur auth
-- ---------------------------------------------------------------------

alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_user_idx on public.orders(user_id);

alter table public.customers
  add column if not exists user_id uuid references auth.users(id) on delete set null;
create unique index if not exists customers_user_key
  on public.customers(user_id) where user_id is not null;

-- Le client connecté lit ses propres commandes (les admins gardent
-- leur politique « admin_all » définie dans schema.sql).
drop policy if exists orders_own_read on public.orders;
create policy orders_own_read on public.orders
  for select using (user_id is not null and user_id = auth.uid());

drop policy if exists order_items_own_read on public.order_items;
create policy order_items_own_read on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id is not null
        and o.user_id = auth.uid()
    )
  );

drop policy if exists customers_own_read on public.customers;
create policy customers_own_read on public.customers
  for select using (user_id is not null and user_id = auth.uid());
