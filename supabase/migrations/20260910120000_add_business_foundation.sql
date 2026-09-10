-- myWallet Business — Phase 1 (Safe Integration Foundation): the business
-- entity, membership, RLS, and a starter chart of accounts seeded on
-- creation. This is purely additive — no Personal Finance table, trigger,
-- or policy is touched by this migration.

create type public.business_type as enum (
  'RETAIL', 'RESTAURANT', 'CONSULTING', 'FREELANCER',
  'CONSTRUCTION', 'SERVICES', 'MANUFACTURING', 'OTHER'
);

create type public.accounting_basis as enum ('CASH', 'ACCRUAL');

create type public.business_member_role as enum (
  'OWNER', 'ACCOUNTANT', 'MANAGER', 'SALES', 'CASHIER'
);

create type public.account_type as enum (
  'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
);

-- ---------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  business_type public.business_type not null default 'OTHER',
  industry text not null default '',
  currency text not null default 'TZS',
  financial_year_start_month smallint not null default 1
    check (financial_year_start_month between 1 and 12),
  accounting_basis public.accounting_basis not null default 'CASH',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_owner_id_idx on public.businesses (owner_id);

alter table public.businesses enable row level security;

-- ---------------------------------------------------------------------
-- business_members
-- ---------------------------------------------------------------------

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.business_member_role not null default 'OWNER',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index business_members_business_id_idx on public.business_members (business_id);
create index business_members_user_id_idx on public.business_members (user_id);

alter table public.business_members enable row level security;

-- Membership check reused by every business-scoped table's RLS below.
-- SECURITY DEFINER so evaluating it isn't itself subject to
-- business_members' own RLS (which would otherwise make it recurse into
-- the policy it's used by) — it only ever answers "is the currently
-- authenticated user a member of this business" for auth.uid() itself, so
-- this can't be used to leak another user's membership.
create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.business_members
    where business_id = target_business_id and user_id = auth.uid()
  );
$$;

-- Deliberately checks owner_id directly, not just is_business_member(id):
-- the OWNER row in business_members is only inserted by the AFTER INSERT
-- trigger below, which hasn't run yet at the point Postgres evaluates this
-- SELECT policy for an INSERT ... RETURNING's result row (RLS evaluates
-- RETURNING visibility before AFTER ROW triggers fire) — membership-only
-- would make a fresh business invisible to its own creator's RETURNING
-- clause. Checking ownership directly sidesteps that ordering entirely.
create policy "Members can view their businesses"
  on public.businesses for select
  using (owner_id = auth.uid() or public.is_business_member(id));

create policy "Owners can update their businesses"
  on public.businesses for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Authenticated users can create a business they own"
  on public.businesses for insert
  with check (owner_id = auth.uid());

-- No delete policy yet: removing a business needs cascade-safety design
-- once accounting/transaction data exists (Phase 2+), so it isn't exposed
-- to the client until then.

create policy "Members can view business membership"
  on public.business_members for select
  using (public.is_business_member(business_id));

-- Membership rows are server-managed only for now (seeded by the
-- business-creation trigger below) — no multi-user invites yet (spec
-- Phase 9), so there is deliberately no client insert/update/delete
-- policy on this table.

-- Seeds the creator as OWNER and the starter chart of accounts the moment
-- a business is created — mirrors handle_new_user's role for signup.
create or replace function public.handle_new_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_members (business_id, user_id, role)
  values (new.id, new.owner_id, 'OWNER');

  perform public.seed_starter_chart_of_accounts(new.id);

  return new;
end;
$$;

create trigger on_business_created
  after insert on public.businesses
  for each row execute function public.handle_new_business();

create trigger set_updated_at before update on public.businesses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- accounts (chart of accounts)
-- ---------------------------------------------------------------------

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  code text not null,
  name text not null,
  type public.account_type not null,
  subtype text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, code)
);

create index accounts_business_id_idx on public.accounts (business_id);

alter table public.accounts enable row level security;

create policy "Members can view business accounts"
  on public.accounts for select
  using (public.is_business_member(business_id));

create policy "Members can insert business accounts"
  on public.accounts for insert
  with check (public.is_business_member(business_id));

create policy "Members can update business accounts"
  on public.accounts for update
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "Members can delete non-default business accounts"
  on public.accounts for delete
  using (public.is_business_member(business_id) and is_default = false);

create trigger set_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();

-- Starter chart of accounts, seeded once per new business by
-- handle_new_business above — same spirit as handle_new_user's default
-- category seed for Personal Finance. Not callable directly by clients.
create or replace function public.seed_starter_chart_of_accounts(target_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.accounts (business_id, code, name, type, subtype, is_default)
  values
    (target_business_id, '1000', 'Cash', 'ASSET', 'Current Asset', true),
    (target_business_id, '1010', 'Bank', 'ASSET', 'Current Asset', true),
    (target_business_id, '1200', 'Accounts Receivable', 'ASSET', 'Current Asset', true),
    (target_business_id, '1300', 'Inventory', 'ASSET', 'Current Asset', true),
    (target_business_id, '1500', 'Equipment', 'ASSET', 'Non-current Asset', true),
    (target_business_id, '2000', 'Accounts Payable', 'LIABILITY', 'Current Liability', true),
    (target_business_id, '2100', 'Loans', 'LIABILITY', 'Non-current Liability', true),
    (target_business_id, '2900', 'Other Liabilities', 'LIABILITY', 'Current Liability', true),
    (target_business_id, '3000', 'Owner''s Capital', 'EQUITY', '', true),
    (target_business_id, '3100', 'Retained Earnings', 'EQUITY', '', true),
    (target_business_id, '3200', 'Owner''s Drawings', 'EQUITY', '', true),
    (target_business_id, '4000', 'Product Sales', 'REVENUE', '', true),
    (target_business_id, '4100', 'Service Revenue', 'REVENUE', '', true),
    (target_business_id, '5000', 'Rent', 'EXPENSE', 'Operating Expense', true),
    (target_business_id, '5100', 'Salaries', 'EXPENSE', 'Operating Expense', true),
    (target_business_id, '5200', 'Transport', 'EXPENSE', 'Operating Expense', true),
    (target_business_id, '5300', 'Marketing', 'EXPENSE', 'Operating Expense', true),
    (target_business_id, '5400', 'Utilities', 'EXPENSE', 'Operating Expense', true),
    (target_business_id, '5900', 'Other Expenses', 'EXPENSE', 'Operating Expense', true);
end;
$$;

revoke all on function public.seed_starter_chart_of_accounts(uuid) from public, anon, authenticated;
