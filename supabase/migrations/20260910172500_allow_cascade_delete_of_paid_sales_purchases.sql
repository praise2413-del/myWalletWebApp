-- Real bug found while cleaning up a Phase 4 test account: the paid-
-- invoice/bill delete guard also fired during a *cascade* delete (e.g.
-- deleting the owning business, or delete_own_account() cascading
-- auth.users -> businesses -> sales/purchases) and blocked it outright —
-- meaning any user who had ever recorded a paid sale or purchase could
-- never delete their account at all. The guard's actual purpose is to
-- stop a *direct* client delete of one invoice from silently destroying
-- payment history while the business stays around; a cascade from
-- deleting the whole business/account should always fully succeed, no
-- exceptions.
--
-- pg_trigger_depth() distinguishes the two: a direct `DELETE FROM sales
-- WHERE id = ...` fires this BEFORE trigger at depth 1; a cascade
-- (deleting businesses -> FK ON DELETE CASCADE fires as its own nested
-- trigger context -> which deletes the sales row -> which fires this
-- trigger one level deeper) fires it at depth 2+. Only block at depth 1.

create or replace function public.prevent_paid_sale_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() <= 1 and exists (select 1 from public.sale_payments where sale_id = old.id) then
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
  if pg_trigger_depth() <= 1 and exists (select 1 from public.purchase_payments where purchase_id = old.id) then
    raise exception 'This bill has payments recorded against it and cannot be deleted';
  end if;

  update public.products p
  set quantity_on_hand = p.quantity_on_hand - pl.quantity
  from public.purchase_lines pl
  where pl.purchase_id = old.id and pl.product_id = p.id;

  return old;
end;
$$;
