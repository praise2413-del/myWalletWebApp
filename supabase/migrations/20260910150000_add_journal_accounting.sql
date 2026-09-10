-- myWallet Business — Phase 2 (Accounting): a real double-entry
-- journal/ledger engine on top of Phase 1's chart of accounts. Purely
-- additive — no Personal Finance or Phase 1 table/trigger/policy is
-- touched.

-- ---------------------------------------------------------------------
-- journal_entries / journal_entry_lines
-- ---------------------------------------------------------------------

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  entry_date date not null,
  description text not null,
  reference text not null default '',
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index journal_entries_business_id_idx on public.journal_entries (business_id);
create index journal_entries_entry_date_idx on public.journal_entries (business_id, entry_date);

alter table public.journal_entries enable row level security;

create policy "Members can view journal entries"
  on public.journal_entries for select
  using (public.is_business_member(business_id));

create policy "Members can delete journal entries"
  on public.journal_entries for delete
  using (public.is_business_member(business_id));

-- Deliberately no insert/update policy: entries are only ever created via
-- create_journal_entry() below, which validates the whole entry balances
-- (total debits = total credits across every line) before writing
-- anything — a cross-row invariant a plain RLS insert policy can't
-- enforce. There's no "edit a posted entry" path yet either (same
-- reasoning accountants use: correct with a new entry, don't rewrite
-- history) — a future phase can add one deliberately if needed.

create table public.journal_entry_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  debit numeric(14, 2) not null default 0,
  credit numeric(14, 2) not null default 0,
  line_order smallint not null default 0,
  created_at timestamptz not null default now(),
  check (debit >= 0 and credit >= 0),
  -- Exactly one side of a line is ever nonzero: not both (that's not a
  -- single debit-or-credit movement) and not neither (an empty line).
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);

create index journal_entry_lines_entry_id_idx on public.journal_entry_lines (journal_entry_id);
create index journal_entry_lines_account_id_idx on public.journal_entry_lines (account_id);
create index journal_entry_lines_business_id_idx on public.journal_entry_lines (business_id);

alter table public.journal_entry_lines enable row level security;

create policy "Members can view journal entry lines"
  on public.journal_entry_lines for select
  using (public.is_business_member(business_id));

-- No insert/update/delete policy: lines are only ever written by
-- create_journal_entry() (SECURITY DEFINER) and removed via the parent
-- journal_entries row's ON DELETE CASCADE — enforced by the foreign key
-- itself, not through PostgREST, so it needs no client-facing delete
-- policy of its own to work.

-- ---------------------------------------------------------------------
-- create_journal_entry: the only way a client can post a journal entry.
-- Atomic (one function invocation = one transaction) and validates the
-- whole entry — membership, every line, and the debit/credit balance —
-- before writing the entry or any line.
-- ---------------------------------------------------------------------

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
  v_total_debit numeric(14, 2) := 0;
  v_total_credit numeric(14, 2) := 0;
  v_raw_line jsonb;
  v_account_id uuid;
  v_debit numeric(14, 2);
  v_credit numeric(14, 2);
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Not a member of this business';
  end if;

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
  values (p_business_id, p_entry_date, trim(p_description), coalesce(trim(p_reference), ''), auth.uid())
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

revoke all on function public.create_journal_entry(uuid, date, text, text, jsonb) from public, anon;
grant execute on function public.create_journal_entry(uuid, date, text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- account_balances: a security-invoker view (Postgres 15+) so it's
-- subject to the querying user's own RLS on accounts/journal_entry_lines
-- rather than the view owner's rights — no separate access-control
-- surface to keep in sync with the tables' own policies. ASSET/EXPENSE
-- accounts have a normal debit balance, LIABILITY/EQUITY/REVENUE a
-- normal credit balance.
-- ---------------------------------------------------------------------

create view public.account_balances
with (security_invoker = true) as
select
  a.id as account_id,
  a.business_id,
  a.code,
  a.name,
  a.type,
  coalesce(sum(l.debit), 0) as total_debit,
  coalesce(sum(l.credit), 0) as total_credit,
  case
    when a.type in ('ASSET', 'EXPENSE') then coalesce(sum(l.debit), 0) - coalesce(sum(l.credit), 0)
    else coalesce(sum(l.credit), 0) - coalesce(sum(l.debit), 0)
  end as balance
from public.accounts a
left join public.journal_entry_lines l on l.account_id = a.id
group by a.id;
