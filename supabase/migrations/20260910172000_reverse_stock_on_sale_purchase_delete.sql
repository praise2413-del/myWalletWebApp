-- Fix found while testing Phase 4: deleting a sale/purchase already
-- reverses its journal entry (see the previous migration) but left
-- quantity_on_hand untouched — a deleted sale permanently "lost" the 2
-- units it had decremented, and a deleted purchase permanently "kept"
-- the units it had added. Reverses stock in the same BEFORE DELETE
-- trigger that already blocks a paid delete (not an AFTER trigger,
-- deliberately — sale_lines/purchase_lines are ON DELETE CASCADE from
-- the parent row, so their data must be read before the parent delete
-- proceeds, not after).

create or replace function public.prevent_paid_sale_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.sale_payments where sale_id = old.id) then
    raise exception 'This invoice has payments recorded against it and cannot be deleted';
  end if;

  update public.products p
  set quantity_on_hand = p.quantity_on_hand + sl.quantity
  from public.sale_lines sl
  where sl.sale_id = old.id and sl.product_id = p.id;

  return old;
end;
$$;

create or replace function public.prevent_paid_purchase_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.purchase_payments where purchase_id = old.id) then
    raise exception 'This bill has payments recorded against it and cannot be deleted';
  end if;

  update public.products p
  set quantity_on_hand = p.quantity_on_hand - pl.quantity
  from public.purchase_lines pl
  where pl.purchase_id = old.id and pl.product_id = p.id;

  return old;
end;
$$;
