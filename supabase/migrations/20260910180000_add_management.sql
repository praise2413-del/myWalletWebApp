-- myWallet Business — Phase 7 (Management): budgets, goals, and a
-- payment calendar. Purely planning/forward-looking data — budgets and
-- goals are simple master data (direct client CRUD, membership-gated,
-- same pattern as customers/suppliers/products: no cross-row invariant
-- to protect). The "calendar" needs no new table at all — it's just a
-- due-date view over Phase 4's existing sales/purchases.

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  year smallint not null check (year between 2000 and 2100),
  amount numeric(14, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, account_id, month, year)
);

create index budgets_business_id_idx on public.budgets (business_id);
alter table public.budgets enable row level security;

create policy "Members can view budgets" on public.budgets for select using (public.is_business_member(business_id));
create policy "Members can insert budgets" on public.budgets for insert with check (public.is_business_member(business_id));
create policy "Members can update budgets" on public.budgets for update using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy "Members can delete budgets" on public.budgets for delete using (public.is_business_member(business_id));

create trigger set_updated_at before update on public.budgets for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- business_goals — progress is always computed client-side from real
-- posted data (revenue/net profit/cash position), never entered
-- manually, so it can't drift out of sync with the books.
-- ---------------------------------------------------------------------

create type public.goal_type as enum ('REVENUE', 'NET_PROFIT', 'CASH_RESERVE');

create table public.business_goals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  goal_type public.goal_type not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  start_date date not null,
  target_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_goals_business_id_idx on public.business_goals (business_id);
alter table public.business_goals enable row level security;

create policy "Members can view goals" on public.business_goals for select using (public.is_business_member(business_id));
create policy "Members can insert goals" on public.business_goals for insert with check (public.is_business_member(business_id));
create policy "Members can update goals" on public.business_goals for update using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy "Members can delete goals" on public.business_goals for delete using (public.is_business_member(business_id));

create trigger set_updated_at before update on public.business_goals for each row execute function public.set_updated_at();
