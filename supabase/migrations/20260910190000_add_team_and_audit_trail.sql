-- myWallet Business — Phase 9 (Professional Platform): team management
-- (invite/remove/re-role members) and an activity log. Multi-business
-- itself needs no new work here — a user has been able to own and switch
-- between several businesses since Phase 1 (BusinessProvider already
-- lists every business the user belongs to).

create or replace function public.is_business_owner(target_business_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.businesses where id = target_business_id and owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- activity_log — a lightweight audit trail. System-populated only (via
-- _log_activity, called from every RPC that posts a financial action,
-- plus the member-change trigger below) — no client insert/update/delete
-- policy, same pattern as `notifications`.
-- ---------------------------------------------------------------------

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null default '',
  entity_id uuid,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index activity_log_business_id_idx on public.activity_log (business_id, created_at desc);
alter table public.activity_log enable row level security;

create policy "Members can view activity log" on public.activity_log for select using (public.is_business_member(business_id));

create or replace function public._log_activity(
  p_business_id uuid,
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_description text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_log (business_id, user_id, action, entity_type, entity_id, description)
  values (p_business_id, p_user_id, p_action, p_entity_type, p_entity_id, p_description);
end;
$$;

revoke all on function public._log_activity(uuid, uuid, text, text, uuid, text) from public, anon, authenticated;

-- Log the four RPCs that post financial activity, as their last step.

create or replace function public.create_journal_entry(
  p_business_id uuid,
  p_entry_date date,
  p_description text,
  p_reference text,
  p_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id uuid;
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Not a member of this business';
  end if;
  v_entry_id := public._post_journal_lines(p_business_id, p_entry_date, p_description, p_reference, p_lines, auth.uid());
  perform public._log_activity(p_business_id, auth.uid(), 'JOURNAL_ENTRY_CREATED', 'journal_entries', v_entry_id, p_description);
  return v_entry_id;
end;
$$;

create or replace function public.create_sale_invoice(
  p_business_id uuid,
  p_customer_id uuid,
  p_invoice_number text,
  p_invoice_date date,
  p_due_date date,
  p_notes text,
  p_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_entry_id uuid;
  v_ar_account_id uuid;
  v_raw_line jsonb;
  v_product_id uuid;
  v_quantity numeric(14, 2);
  v_unit_price numeric(14, 2);
  v_line_total numeric(14, 2);
  v_total numeric(14, 2) := 0;
  v_income_account_id uuid;
  v_journal_lines jsonb := '[]'::jsonb;
  v_income_totals jsonb := '{}'::jsonb;
  v_key text;
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Not a member of this business';
  end if;
  if p_customer_id is not null and not exists (select 1 from public.customers where id = p_customer_id and business_id = p_business_id) then
    raise exception 'Customer does not belong to this business';
  end if;
  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'An invoice needs at least one line';
  end if;

  select id into v_ar_account_id from public.accounts where business_id = p_business_id and code = '1200';
  if v_ar_account_id is null then
    raise exception 'No Accounts Receivable account found for this business';
  end if;

  insert into public.sales (business_id, customer_id, invoice_number, invoice_date, due_date, notes, created_by)
  values (p_business_id, p_customer_id, coalesce(trim(p_invoice_number), ''), p_invoice_date, p_due_date, coalesce(p_notes, ''), auth.uid())
  returning id into v_sale_id;

  for v_raw_line in select * from jsonb_array_elements(p_lines)
  loop
    v_product_id := (v_raw_line ->> 'product_id')::uuid;
    v_quantity := (v_raw_line ->> 'quantity')::numeric(14, 2);
    v_unit_price := (v_raw_line ->> 'unit_price')::numeric(14, 2);

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Quantity must be greater than zero';
    end if;
    if v_unit_price is null or v_unit_price < 0 then
      raise exception 'Unit price cannot be negative';
    end if;

    select income_account_id into v_income_account_id from public.products where id = v_product_id and business_id = p_business_id;
    if v_income_account_id is null then
      raise exception 'One of the selected products does not belong to this business';
    end if;

    v_line_total := round(v_quantity * v_unit_price, 2);
    v_total := v_total + v_line_total;

    insert into public.sale_lines (sale_id, business_id, product_id, quantity, unit_price, line_total, line_order)
    values (v_sale_id, p_business_id, v_product_id, v_quantity, v_unit_price, v_line_total,
            (select count(*) from public.sale_lines where sale_id = v_sale_id));

    update public.products set quantity_on_hand = quantity_on_hand - v_quantity where id = v_product_id;

    v_key := v_income_account_id::text;
    v_income_totals := jsonb_set(v_income_totals, array[v_key], to_jsonb(coalesce((v_income_totals ->> v_key)::numeric(14, 2), 0) + v_line_total));
  end loop;

  v_journal_lines := jsonb_build_array(jsonb_build_object('account_id', v_ar_account_id, 'debit', v_total, 'credit', 0));
  for v_key in select jsonb_object_keys(v_income_totals)
  loop
    v_journal_lines := v_journal_lines || jsonb_build_array(
      jsonb_build_object('account_id', v_key::uuid, 'debit', 0, 'credit', (v_income_totals ->> v_key)::numeric(14, 2))
    );
  end loop;

  v_entry_id := public._post_journal_lines(
    p_business_id, p_invoice_date,
    'Sale invoice' || case when trim(coalesce(p_invoice_number, '')) <> '' then ' ' || trim(p_invoice_number) else '' end,
    coalesce(trim(p_invoice_number), ''), v_journal_lines, auth.uid()
  );

  update public.sales set journal_entry_id = v_entry_id where id = v_sale_id;

  perform public._log_activity(p_business_id, auth.uid(), 'SALE_CREATED', 'sales', v_sale_id,
    'Created sale invoice' || case when trim(coalesce(p_invoice_number, '')) <> '' then ' ' || trim(p_invoice_number) else '' end);

  return v_sale_id;
end;
$$;

create or replace function public.create_purchase_bill(
  p_business_id uuid,
  p_supplier_id uuid,
  p_bill_number text,
  p_bill_date date,
  p_due_date date,
  p_notes text,
  p_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase_id uuid;
  v_entry_id uuid;
  v_ap_account_id uuid;
  v_raw_line jsonb;
  v_product_id uuid;
  v_quantity numeric(14, 2);
  v_unit_price numeric(14, 2);
  v_line_total numeric(14, 2);
  v_total numeric(14, 2) := 0;
  v_expense_account_id uuid;
  v_journal_lines jsonb := '[]'::jsonb;
  v_expense_totals jsonb := '{}'::jsonb;
  v_key text;
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Not a member of this business';
  end if;
  if p_supplier_id is not null and not exists (select 1 from public.suppliers where id = p_supplier_id and business_id = p_business_id) then
    raise exception 'Supplier does not belong to this business';
  end if;
  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'A bill needs at least one line';
  end if;

  select id into v_ap_account_id from public.accounts where business_id = p_business_id and code = '2000';
  if v_ap_account_id is null then
    raise exception 'No Accounts Payable account found for this business';
  end if;

  insert into public.purchases (business_id, supplier_id, bill_number, bill_date, due_date, notes, created_by)
  values (p_business_id, p_supplier_id, coalesce(trim(p_bill_number), ''), p_bill_date, p_due_date, coalesce(p_notes, ''), auth.uid())
  returning id into v_purchase_id;

  for v_raw_line in select * from jsonb_array_elements(p_lines)
  loop
    v_product_id := (v_raw_line ->> 'product_id')::uuid;
    v_quantity := (v_raw_line ->> 'quantity')::numeric(14, 2);
    v_unit_price := (v_raw_line ->> 'unit_price')::numeric(14, 2);

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Quantity must be greater than zero';
    end if;
    if v_unit_price is null or v_unit_price < 0 then
      raise exception 'Unit price cannot be negative';
    end if;

    select expense_account_id into v_expense_account_id from public.products where id = v_product_id and business_id = p_business_id;
    if v_expense_account_id is null then
      raise exception 'One of the selected products does not belong to this business';
    end if;

    v_line_total := round(v_quantity * v_unit_price, 2);
    v_total := v_total + v_line_total;

    insert into public.purchase_lines (purchase_id, business_id, product_id, quantity, unit_price, line_total, line_order)
    values (v_purchase_id, p_business_id, v_product_id, v_quantity, v_unit_price, v_line_total,
            (select count(*) from public.purchase_lines where purchase_id = v_purchase_id));

    update public.products set quantity_on_hand = quantity_on_hand + v_quantity where id = v_product_id;

    v_key := v_expense_account_id::text;
    v_expense_totals := jsonb_set(v_expense_totals, array[v_key], to_jsonb(coalesce((v_expense_totals ->> v_key)::numeric(14, 2), 0) + v_line_total));
  end loop;

  v_journal_lines := '[]'::jsonb;
  for v_key in select jsonb_object_keys(v_expense_totals)
  loop
    v_journal_lines := v_journal_lines || jsonb_build_array(
      jsonb_build_object('account_id', v_key::uuid, 'debit', (v_expense_totals ->> v_key)::numeric(14, 2), 'credit', 0)
    );
  end loop;
  v_journal_lines := v_journal_lines || jsonb_build_array(jsonb_build_object('account_id', v_ap_account_id, 'debit', 0, 'credit', v_total));

  v_entry_id := public._post_journal_lines(
    p_business_id, p_bill_date,
    'Purchase bill' || case when trim(coalesce(p_bill_number, '')) <> '' then ' ' || trim(p_bill_number) else '' end,
    coalesce(trim(p_bill_number), ''), v_journal_lines, auth.uid()
  );

  update public.purchases set journal_entry_id = v_entry_id where id = v_purchase_id;

  perform public._log_activity(p_business_id, auth.uid(), 'PURCHASE_CREATED', 'purchases', v_purchase_id,
    'Created purchase bill' || case when trim(coalesce(p_bill_number, '')) <> '' then ' ' || trim(p_bill_number) else '' end);

  return v_purchase_id;
end;
$$;

create or replace function public.record_sale_payment(
  p_sale_id uuid,
  p_payment_date date,
  p_amount numeric,
  p_account_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_ar_account_id uuid;
  v_total numeric(14, 2);
  v_already_paid numeric(14, 2);
  v_entry_id uuid;
  v_payment_id uuid;
begin
  select business_id into v_business_id from public.sales where id = p_sale_id;
  if v_business_id is null then
    raise exception 'Invoice not found';
  end if;
  if not public.is_business_member(v_business_id) then
    raise exception 'Not a member of this business';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;
  if not exists (select 1 from public.accounts where id = p_account_id and business_id = v_business_id) then
    raise exception 'Account does not belong to this business';
  end if;

  select id into v_ar_account_id from public.accounts where business_id = v_business_id and code = '1200';

  select coalesce(sum(sl.line_total), 0) into v_total from public.sale_lines sl where sl.sale_id = p_sale_id;
  select coalesce(sum(sp.amount), 0) into v_already_paid from public.sale_payments sp where sp.sale_id = p_sale_id;

  if v_already_paid + p_amount > v_total + 0.01 then
    raise exception 'Payment of % would exceed the remaining balance of %', p_amount, v_total - v_already_paid;
  end if;

  v_entry_id := public._post_journal_lines(
    v_business_id, p_payment_date, 'Payment received for invoice', '',
    jsonb_build_array(
      jsonb_build_object('account_id', p_account_id, 'debit', p_amount, 'credit', 0),
      jsonb_build_object('account_id', v_ar_account_id, 'debit', 0, 'credit', p_amount)
    ),
    auth.uid()
  );

  insert into public.sale_payments (sale_id, business_id, payment_date, amount, account_id, journal_entry_id, created_by)
  values (p_sale_id, v_business_id, p_payment_date, p_amount, p_account_id, v_entry_id, auth.uid())
  returning id into v_payment_id;

  perform public._log_activity(v_business_id, auth.uid(), 'SALE_PAYMENT_RECORDED', 'sale_payments', v_payment_id, 'Recorded a payment against an invoice');

  return v_payment_id;
end;
$$;

create or replace function public.record_purchase_payment(
  p_purchase_id uuid,
  p_payment_date date,
  p_amount numeric,
  p_account_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_ap_account_id uuid;
  v_total numeric(14, 2);
  v_already_paid numeric(14, 2);
  v_entry_id uuid;
  v_payment_id uuid;
begin
  select business_id into v_business_id from public.purchases where id = p_purchase_id;
  if v_business_id is null then
    raise exception 'Bill not found';
  end if;
  if not public.is_business_member(v_business_id) then
    raise exception 'Not a member of this business';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;
  if not exists (select 1 from public.accounts where id = p_account_id and business_id = v_business_id) then
    raise exception 'Account does not belong to this business';
  end if;

  select id into v_ap_account_id from public.accounts where business_id = v_business_id and code = '2000';

  select coalesce(sum(pl.line_total), 0) into v_total from public.purchase_lines pl where pl.purchase_id = p_purchase_id;
  select coalesce(sum(pp.amount), 0) into v_already_paid from public.purchase_payments pp where pp.purchase_id = p_purchase_id;

  if v_already_paid + p_amount > v_total + 0.01 then
    raise exception 'Payment of % would exceed the remaining balance of %', p_amount, v_total - v_already_paid;
  end if;

  v_entry_id := public._post_journal_lines(
    v_business_id, p_payment_date, 'Payment made for bill', '',
    jsonb_build_array(
      jsonb_build_object('account_id', v_ap_account_id, 'debit', p_amount, 'credit', 0),
      jsonb_build_object('account_id', p_account_id, 'debit', 0, 'credit', p_amount)
    ),
    auth.uid()
  );

  insert into public.purchase_payments (purchase_id, business_id, payment_date, amount, account_id, journal_entry_id, created_by)
  values (p_purchase_id, v_business_id, p_payment_date, p_amount, p_account_id, v_entry_id, auth.uid())
  returning id into v_payment_id;

  perform public._log_activity(v_business_id, auth.uid(), 'PURCHASE_PAYMENT_RECORDED', 'purchase_payments', v_payment_id, 'Recorded a payment against a bill');

  return v_payment_id;
end;
$$;

-- Log deletes too (sales/purchases delete triggers already run BEFORE DELETE for the paid-guard/stock-reversal — piggyback the log call there).

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

  if pg_trigger_depth() <= 1 then
    perform public._log_activity(old.business_id, auth.uid(), 'SALE_DELETED', 'sales', old.id, 'Deleted a sale invoice');
  end if;

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

  if pg_trigger_depth() <= 1 then
    perform public._log_activity(old.business_id, auth.uid(), 'PURCHASE_DELETED', 'purchases', old.id, 'Deleted a purchase bill');
  end if;

  return old;
end;
$$;

-- ---------------------------------------------------------------------
-- Team management: invite by email (only a real myWallet account can be
-- invited — no email-sending infrastructure in this project, see
-- Phase 3's Auth notes), owner-only role changes/removal.
-- ---------------------------------------------------------------------

create policy "Owners can update member roles" on public.business_members for update
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id) and role <> 'OWNER');

create policy "Owners can remove non-owner members" on public.business_members for delete
  using (public.is_business_owner(business_id) and role <> 'OWNER');

create or replace function public.invite_business_member(
  p_business_id uuid,
  p_email text,
  p_role public.business_member_role
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.is_business_owner(p_business_id) then
    raise exception 'Only the business owner can invite team members';
  end if;
  if p_role = 'OWNER' then
    raise exception 'Cannot invite someone as Owner';
  end if;

  select id into v_user_id from auth.users where lower(email) = lower(trim(p_email));
  if v_user_id is null then
    raise exception 'No myWallet account found for that email. Ask them to sign up first, then invite them.';
  end if;

  if exists (select 1 from public.business_members where business_id = p_business_id and user_id = v_user_id) then
    raise exception 'This person is already a member of this business';
  end if;

  insert into public.business_members (business_id, user_id, role) values (p_business_id, v_user_id, p_role);

  perform public._log_activity(p_business_id, auth.uid(), 'MEMBER_INVITED', 'business_members', v_user_id, 'Invited a new team member as ' || p_role);

  return v_user_id;
end;
$$;

revoke all on function public.invite_business_member(uuid, text, public.business_member_role) from public, anon;
grant execute on function public.invite_business_member(uuid, text, public.business_member_role) to authenticated;

-- Direct client role-change/removal (RLS-gated above) still needs
-- logging — a trigger, since there's no RPC wrapping those simple calls.
create or replace function public.log_member_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'DELETE' then
    perform public._log_activity(old.business_id, auth.uid(), 'MEMBER_REMOVED', 'business_members', old.user_id, 'Removed a team member');
    return old;
  elsif TG_OP = 'UPDATE' and new.role is distinct from old.role then
    perform public._log_activity(new.business_id, auth.uid(), 'MEMBER_ROLE_CHANGED', 'business_members', new.user_id, 'Changed a team member role to ' || new.role);
    return new;
  end if;
  return new;
end;
$$;

create trigger log_member_delete before delete on public.business_members
  for each row execute function public.log_member_change();
create trigger log_member_update after update on public.business_members
  for each row execute function public.log_member_change();

-- Resolves member/actor user_ids to emails for display — safe because the
-- WHERE clause only returns rows for businesses the caller is themselves
-- a member of (no way to look up an unrelated user's email this way).
create or replace function public.get_business_member_emails(p_business_id uuid)
returns table (user_id uuid, email text)
language sql
security definer
stable
set search_path = public
as $$
  select bm.user_id, u.email::text
  from public.business_members bm
  join auth.users u on u.id = bm.user_id
  where bm.business_id = p_business_id and public.is_business_member(p_business_id);
$$;

revoke all on function public.get_business_member_emails(uuid) from public, anon;
grant execute on function public.get_business_member_emails(uuid) to authenticated;
