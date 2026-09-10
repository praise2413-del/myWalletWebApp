-- Fix found while testing Phase 4: prevent_paid_sale_delete() and
-- prevent_paid_purchase_delete() ran as BEFORE DELETE triggers that
-- themselves deleted the linked journal_entries row. But sales/purchases
-- .journal_entry_id is `references journal_entries(id) on delete set
-- null` — deleting that journal_entries row mid-BEFORE-trigger makes
-- Postgres try to UPDATE the very sales/purchases row currently being
-- deleted (to null out journal_entry_id), which collides with the
-- outer DELETE already in progress on that same row: "tuple to be
-- deleted was already modified by an operation triggered by the current
-- command". Postgres's own error hint says it: validation (which must
-- block the delete) stays BEFORE; the journal_entries cleanup (a side
-- effect on a different table) moves to AFTER, once the sales/purchases
-- row is already gone and the FK's ON DELETE SET NULL action has
-- nothing left to act on.

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
  return old;
end;
$$;

create or replace function public.cleanup_sale_journal_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.journal_entry_id is not null then
    delete from public.journal_entries where id = old.journal_entry_id;
  end if;
  return old;
end;
$$;

drop trigger if exists before_delete_sale on public.sales;
create trigger before_delete_sale before delete on public.sales
  for each row execute function public.prevent_paid_sale_delete();
create trigger after_delete_sale after delete on public.sales
  for each row execute function public.cleanup_sale_journal_entry();

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
  return old;
end;
$$;

create or replace function public.cleanup_purchase_journal_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.journal_entry_id is not null then
    delete from public.journal_entries where id = old.journal_entry_id;
  end if;
  return old;
end;
$$;

drop trigger if exists before_delete_purchase on public.purchases;
create trigger before_delete_purchase before delete on public.purchases
  for each row execute function public.prevent_paid_purchase_delete();
create trigger after_delete_purchase after delete on public.purchases
  for each row execute function public.cleanup_purchase_journal_entry();
