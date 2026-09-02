-- myWallet: core schema (profiles, categories, transactions), RLS, and
-- new-user provisioning (profile + default categories seeded on signup).

create type public.transaction_type as enum ('INCOME', 'EXPENSE');

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  currency text not null default 'TZS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type public.transaction_type not null,
  icon text not null default 'wallet',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create index categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own non-default categories"
  on public.categories for delete
  using (auth.uid() = user_id and is_default = false);

-- ---------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  transaction_date date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_id_idx on public.transactions (user_id);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_transaction_date_idx on public.transactions (transaction_date);
create index transactions_type_idx on public.transactions (type);

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- A transaction's type must always match the type of the category it's
-- filed under, and the category must belong to the same user. This can't
-- be a CHECK constraint (no cross-table lookups), so it's a trigger.
create or replace function public.enforce_transaction_category_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_type public.transaction_type;
  category_owner uuid;
begin
  select type, user_id into category_type, category_owner
  from public.categories
  where id = new.category_id;

  if category_type is null then
    raise exception 'Category % does not exist', new.category_id;
  end if;

  if category_owner <> new.user_id then
    raise exception 'Category does not belong to this user';
  end if;

  if category_type <> new.type then
    raise exception 'Category type (%) does not match transaction type (%)', category_type, new.type;
  end if;

  return new;
end;
$$;

create trigger transactions_enforce_category_type
  before insert or update on public.transactions
  for each row execute function public.enforce_transaction_category_type();

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- new user provisioning: profile row + default categories
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, currency)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'TZS');

  insert into public.categories (user_id, name, type, icon, is_default)
  values
    (new.id, 'Food', 'EXPENSE', 'utensils-crossed', true),
    (new.id, 'Transport', 'EXPENSE', 'bus', true),
    (new.id, 'Rent', 'EXPENSE', 'home', true),
    (new.id, 'Utilities', 'EXPENSE', 'zap', true),
    (new.id, 'Education', 'EXPENSE', 'graduation-cap', true),
    (new.id, 'Health', 'EXPENSE', 'heart', true),
    (new.id, 'Shopping', 'EXPENSE', 'shopping-bag', true),
    (new.id, 'Entertainment', 'EXPENSE', 'clapperboard', true),
    (new.id, 'Communication', 'EXPENSE', 'phone', true),
    (new.id, 'Family', 'EXPENSE', 'baby', true),
    (new.id, 'Personal Care', 'EXPENSE', 'sparkles', true),
    (new.id, 'Bills', 'EXPENSE', 'receipt', true),
    (new.id, 'Other', 'EXPENSE', 'wallet', true),
    (new.id, 'Salary', 'INCOME', 'wallet', true),
    (new.id, 'Business', 'INCOME', 'briefcase', true),
    (new.id, 'Freelance', 'INCOME', 'briefcase', true),
    (new.id, 'Allowance', 'INCOME', 'banknote', true),
    (new.id, 'Gift', 'INCOME', 'gift', true),
    (new.id, 'Investment', 'INCOME', 'trending-up', true),
    (new.id, 'Other', 'INCOME', 'wallet', true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
