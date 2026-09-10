-- myWallet Business — Phase 4 (Operations): customers, suppliers, products,
-- sales invoices, and purchase bills. Sales/purchases post real journal
-- entries automatically (Dr/Cr the right accounts) rather than asking a
-- non-accountant user to build a journal entry by hand — Phase 2's engine
-- becomes the posting layer underneath a friendlier operational surface.

-- ---------------------------------------------------------------------
-- Refactor: pull create_journal_entry's validate-and-post logic into an
-- internal function so create_sale_invoice/create_purchase_bill/payment
-- functions below can post their own auto-generated entries through the
-- exact same balance-enforcing path, inside the same transaction as the
-- domain row they're posting for (one failure rolls back everything).
-- ---------------------------------------------------------------------

create or replace function public._post_journal_lines(
  p_business_id uuid,
  p_entry_date date,
  p_description text,
  p_reference text,
  p_lines jsonb,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id uuid;
  v_total_debit numeric(14, 2) := 0;
  v_total_credit numeric(14, 2) := 0;
  v_raw_line jsonb;
  v_account_id uuid;
  v_debit numeric(14, 2);
  v_credit numeric(14, 2);
begin
  if p_description is null or length(trim(p_description)) = 0 then
    raise exception 'Description is required';
  end if;

  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) < 2 then
    raise exception 'A journal entry needs at least two lines';
  end if;

  for v_raw_line in select * from jsonb_array_elements(p_lines)
  loop
    v_account_id := (v_raw_line ->> 'account_id')::uuid;
    v_debit := coalesce((v_raw_line ->> 'debit')::numeric(14, 2), 0);
    v_credit := coalesce((v_raw_line ->> 'credit')::numeric(14, 2), 0);

    if v_debit < 0 or v_credit < 0 then
      raise exception 'Amounts cannot be negative';
    end if;
    if (v_debit > 0) = (v_credit > 0) then
      raise exception 'Each line must be either a debit or a credit, not both or neither';
    end if;
    if not exists (
      select 1 from public.accounts where id = v_account_id and business_id = p_business_id
    ) then
      raise exception 'One of the selected accounts does not belong to this business';
    end if;

    v_total_debit := v_total_debit + v_debit;
    v_total_credit := v_total_credit + v_credit;
  end loop;

  if v_total_debit <> v_total_credit then
    raise exception 'Total debits (%) must equal total credits (%)', v_total_debit, v_total_credit;
  end if;

  if v_total_debit = 0 then
    raise exception 'A journal entry cannot be all zero';
  end if;

  insert into public.journal_entries (business_id, entry_date, description, reference, created_by)
  values (p_business_id, p_entry_date, trim(p_description), coalesce(trim(p_reference), ''), p_created_by)
  returning id into v_entry_id;

  insert into public.journal_entry_lines (journal_entry_id, business_id, account_id, debit, credit, line_order)
  select
    v_entry_id,
    p_business_id,
    (elem ->> 'account_id')::uuid,
    coalesce((elem ->> 'debit')::numeric(14, 2), 0),
    coalesce((elem ->> 'credit')::numeric(14, 2), 0),
    (idx - 1)::smallint
  from jsonb_array_elements(p_lines) with ordinality as t(elem, idx);

  return v_entry_id;
end;
$$;

revoke all on function public._post_journal_lines(uuid, date, text, text, jsonb, uuid) from public, anon, authenticated;

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
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Not a member of this business';
  end if;
  return public._post_journal_lines(p_business_id, p_entry_date, p_description, p_reference, p_lines, auth.uid());
end;
$$;

-- ---------------------------------------------------------------------
-- customers / suppliers — simple master data, direct client CRUD (same
-- pattern as Phase 1's `accounts`: membership-gated, no RPC needed since
-- there's no cross-row invariant to protect here).
-- ---------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_business_id_idx on public.customers (business_id);
alter table public.customers enable row level security;

create policy "Members can view customers" on public.customers for select using (public.is_business_member(business_id));
create policy "Members can insert customers" on public.customers for insert with check (public.is_business_member(business_id));
create policy "Members can update customers" on public.customers for update using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy "Members can delete customers" on public.customers for delete using (public.is_business_member(business_id));

create trigger set_updated_at before update on public.customers for each row execute function public.set_updated_at();

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index suppliers_business_id_idx on public.suppliers (business_id);
alter table public.suppliers enable row level security;

create policy "Members can view suppliers" on public.suppliers for select using (public.is_business_member(business_id));
create policy "Members can insert suppliers" on public.suppliers for insert with check (public.is_business_member(business_id));
create policy "Members can update suppliers" on public.suppliers for update using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy "Members can delete suppliers" on public.suppliers for delete using (public.is_business_member(business_id));

create trigger set_updated_at before update on public.suppliers for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- products — the item catalog. Each product names which account is
-- credited when it's sold (income_account_id) and which is debited when
-- it's purchased (expense_account_id — an Inventory asset account for a
-- resold item, or a plain Expense account for a consumed one). No
-- COGS/costing engine yet — quantity_on_hand is a simple running count,
-- not a costed valuation.
-- ---------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  sku text not null default '',
  name text not null,
  description text not null default '',
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  cost_price numeric(14, 2) not null default 0 check (cost_price >= 0),
  quantity_on_hand numeric(14, 2) not null default 0,
  income_account_id uuid not null references public.accounts (id) on delete restrict,
  expense_account_id uuid not null references public.accounts (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_business_id_idx on public.products (business_id);
create unique index products_business_id_sku_idx on public.products (business_id, sku) where sku <> '';
alter table public.products enable row level security;

create policy "Members can view products" on public.products for select using (public.is_business_member(business_id));
create policy "Members can insert products" on public.products for insert with check (public.is_business_member(business_id));
create policy "Members can update products" on public.products for update using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy "Members can delete products" on public.products for delete using (public.is_business_member(business_id));

create trigger set_updated_at before update on public.products for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- sales (invoices) — created only via create_sale_invoice(), which posts
-- Dr Accounts Receivable / Cr <product income accounts> in the same
-- transaction as the sale + lines, and adjusts stock. Deletable only
-- while unpaid (enforced by trigger below), which also removes the
-- linked journal entry so nothing is left half-reversed.
-- ---------------------------------------------------------------------

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  invoice_number text not null default '',
  invoice_date date not null,
  due_date date,
  notes text not null default '',
  journal_entry_id uuid references public.journal_entries (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index sales_business_id_idx on public.sales (business_id);
create index sales_customer_id_idx on public.sales (customer_id);
alter table public.sales enable row level security;

create policy "Members can view sales" on public.sales for select using (public.is_business_member(business_id));
create policy "Members can delete sales" on public.sales for delete using (public.is_business_member(business_id));
-- No insert/update policy — only create_sale_invoice() writes here.

create table public.sale_lines (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity numeric(14, 2) not null check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  line_total numeric(14, 2) not null,
  line_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index sale_lines_sale_id_idx on public.sale_lines (sale_id);
create index sale_lines_business_id_idx on public.sale_lines (business_id);
alter table public.sale_lines enable row level security;

create policy "Members can view sale lines" on public.sale_lines for select using (public.is_business_member(business_id));

create table public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  payment_date date not null,
  amount numeric(14, 2) not null check (amount > 0),
  account_id uuid not null references public.accounts (id) on delete restrict,
  journal_entry_id uuid references public.journal_entries (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index sale_payments_sale_id_idx on public.sale_payments (sale_id);
create index sale_payments_business_id_idx on public.sale_payments (business_id);
alter table public.sale_payments enable row level security;

create policy "Members can view sale payments" on public.sale_payments for select using (public.is_business_member(business_id));

-- A sale that's been paid against can't be deleted out from under its
-- payments (that would orphan real cash-receipt journal entries) —
-- correct it by recording an offsetting entry, not by deleting history.
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
  if old.journal_entry_id is not null then
    delete from public.journal_entries where id = old.journal_entry_id;
  end if;
  return old;
end;
$$;

create trigger before_delete_sale before delete on public.sales
  for each row execute function public.prevent_paid_sale_delete();

-- ---------------------------------------------------------------------
-- purchases (bills) — the mirror of sales: create_purchase_bill() posts
-- Dr <product expense/inventory accounts> / Cr Accounts Payable.
-- ---------------------------------------------------------------------

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete set null,
  bill_number text not null default '',
  bill_date date not null,
  due_date date,
  notes text not null default '',
  journal_entry_id uuid references public.journal_entries (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index purchases_business_id_idx on public.purchases (business_id);
create index purchases_supplier_id_idx on public.purchases (supplier_id);
alter table public.purchases enable row level security;

create policy "Members can view purchases" on public.purchases for select using (public.is_business_member(business_id));
create policy "Members can delete purchases" on public.purchases for delete using (public.is_business_member(business_id));

create table public.purchase_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity numeric(14, 2) not null check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  line_total numeric(14, 2) not null,
  line_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index purchase_lines_purchase_id_idx on public.purchase_lines (purchase_id);
create index purchase_lines_business_id_idx on public.purchase_lines (business_id);
alter table public.purchase_lines enable row level security;

create policy "Members can view purchase lines" on public.purchase_lines for select using (public.is_business_member(business_id));

create table public.purchase_payments (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  payment_date date not null,
  amount numeric(14, 2) not null check (amount > 0),
  account_id uuid not null references public.accounts (id) on delete restrict,
  journal_entry_id uuid references public.journal_entries (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index purchase_payments_purchase_id_idx on public.purchase_payments (purchase_id);
create index purchase_payments_business_id_idx on public.purchase_payments (business_id);
alter table public.purchase_payments enable row level security;

create policy "Members can view purchase payments" on public.purchase_payments for select using (public.is_business_member(business_id));

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
  if old.journal_entry_id is not null then
    delete from public.journal_entries where id = old.journal_entry_id;
  end if;
  return old;
end;
$$;

create trigger before_delete_purchase before delete on public.purchases
  for each row execute function public.prevent_paid_purchase_delete();

-- ---------------------------------------------------------------------
-- create_sale_invoice / create_purchase_bill / record_*_payment
-- ---------------------------------------------------------------------

create or replace function public.create_sale_invoice(
  p_business_id uuid,
  p_customer_id uuid,
  p_invoice_number text,
  p_invoice_date date,
  p_due_date date,
  p_notes text,
  p_lines jsonb -- [{product_id, quantity, unit_price}]
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

  return v_sale_id;
end;
$$;

revoke all on function public.create_sale_invoice(uuid, uuid, text, date, date, text, jsonb) from public, anon;
grant execute on function public.create_sale_invoice(uuid, uuid, text, date, date, text, jsonb) to authenticated;

create or replace function public.create_purchase_bill(
  p_business_id uuid,
  p_supplier_id uuid,
  p_bill_number text,
  p_bill_date date,
  p_due_date date,
  p_notes text,
  p_lines jsonb -- [{product_id, quantity, unit_price}]
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

  return v_purchase_id;
end;
$$;

revoke all on function public.create_purchase_bill(uuid, uuid, text, date, date, text, jsonb) from public, anon;
grant execute on function public.create_purchase_bill(uuid, uuid, text, date, date, text, jsonb) to authenticated;

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

  return v_payment_id;
end;
$$;

revoke all on function public.record_sale_payment(uuid, date, numeric, uuid) from public, anon;
grant execute on function public.record_sale_payment(uuid, date, numeric, uuid) to authenticated;

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

  return v_payment_id;
end;
$$;

revoke all on function public.record_purchase_payment(uuid, date, numeric, uuid) from public, anon;
grant execute on function public.record_purchase_payment(uuid, date, numeric, uuid) to authenticated;
