-- Savings & Investment Allocation: a distinct concept from expenses.
-- Money a user deliberately sets aside (SAVING) or invests (INVESTMENT)
-- must never inflate their expense totals — it gets its own table and
-- its own reporting/insight treatment.

create type public.allocation_type as enum ('SAVING', 'INVESTMENT');

create table public.allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.allocation_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  allocation_date date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index allocations_user_id_idx on public.allocations (user_id);
create index allocations_allocation_date_idx on public.allocations (allocation_date);
create index allocations_type_idx on public.allocations (type);

alter table public.allocations enable row level security;

create policy "Users can view own allocations"
  on public.allocations for select
  using (auth.uid() = user_id);

create policy "Users can insert own allocations"
  on public.allocations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own allocations"
  on public.allocations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own allocations"
  on public.allocations for delete
  using (auth.uid() = user_id);

create trigger set_updated_at before update on public.allocations
  for each row execute function public.set_updated_at();

-- Personal Savings & Investment Allocation target, as a percentage of
-- recorded income. User-configurable (Settings); defaults to 30%.
alter table public.profiles
  add column allocation_target numeric(5, 2) not null default 30
  check (allocation_target >= 0 and allocation_target <= 100);
