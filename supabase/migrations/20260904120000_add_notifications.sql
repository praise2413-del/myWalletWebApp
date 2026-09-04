-- myWallet: notifications — weekly report reminders, password-change
-- security notifications, and a foundation for future notification types.
--
-- Every row is created server-side (a SECURITY DEFINER function or a
-- trigger) — there is deliberately no INSERT/DELETE policy for the
-- `authenticated` role below, so a client can never forge or fabricate a
-- notification. "Delete" is a soft delete (an UPDATE setting deleted_at),
-- which the UPDATE policy already covers.

create type public.notification_type as enum ('WEEKLY_REPORT', 'PASSWORD_RESET');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  reference_type text,
  reference_id uuid,
  period_start date,
  period_end date
);

create index notifications_user_id_idx on public.notifications (user_id);
-- Powers both the unread-count query and the default (unread-first) list view.
create index notifications_user_unread_idx on public.notifications (user_id, is_read) where deleted_at is null;
create index notifications_created_at_idx on public.notifications (created_at desc);

-- Duplicate prevention for period-based notifications (spec: running the
-- weekly generator twice for the same period must yield only one row).
-- Postgres treats NULLs as distinct from each other in a unique index by
-- default, so this only actually constrains WEEKLY_REPORT rows (which
-- always have period_start/period_end) — PASSWORD_RESET rows (which don't)
-- are unaffected and can recur freely, which is correct.
create unique index notifications_period_unique_idx
  on public.notifications (user_id, type, period_start, period_end);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Weekly report notifications
-- ---------------------------------------------------------------------

-- Computes "the most recently completed Monday-Sunday period" in the
-- user-facing financial timezone (not the Supabase project's hosting
-- region) and idempotently inserts one WEEKLY_REPORT notification per
-- profile for that period. Safe to call any number of times while the
-- same period is still the most recently completed one — the unique
-- index above makes the insert a no-op on repeat calls.
create or replace function public.generate_weekly_report_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tz constant text := 'Africa/Dar_es_Salaam';
  today date := (now() at time zone tz)::date;
  this_monday date := today - (extract(isodow from today)::int - 1);
  -- Prefixed (not `period_start`/`period_end`) so they can't be confused
  -- with the notifications columns of the same name in the INSERT...SELECT
  -- below — plpgsql variables and table columns sharing a name inside a
  -- single SQL statement raises "column reference is ambiguous".
  v_period_start date := this_monday - 7;
  v_period_end date := this_monday - 1;
  -- Always repeats the month on both sides (e.g. "August 31 – September 6,
  -- 2026"), matching the TS formatter in reportPeriod.ts used for the same
  -- kind of custom range elsewhere in the app. This stored message is a
  -- fallback string — the notification card itself re-derives the display
  -- text from period_start/period_end via that same shared TS formatter,
  -- so the two never need to be kept in exact lockstep.
  period_label text := to_char(v_period_start, 'FMMonth FMDD') || ' – ' || to_char(v_period_end, 'FMMonth FMDD, YYYY');
begin
  insert into public.notifications
    (user_id, type, title, message, reference_type, period_start, period_end)
  select
    p.id,
    'WEEKLY_REPORT',
    'Weekly Financial Report Ready',
    format('Your financial report for %s is ready to review.', period_label),
    'REPORT',
    v_period_start,
    v_period_end
  from public.profiles p
  on conflict (user_id, type, period_start, period_end) do nothing;
end;
$$;

revoke all on function public.generate_weekly_report_notifications() from public, anon, authenticated;

-- Hourly: near-immediate delivery after the Monday-EAT boundary, and
-- self-healing if a run is ever missed — the next run just re-confirms
-- the same still-current period (a no-op via the unique index above).
-- All real date logic happens inside the function against the explicit
-- Africa/Dar_es_Salaam zone, so the cron scheduler's own timezone doesn't
-- matter here.
create extension if not exists pg_cron;

select cron.schedule(
  'weekly-report-notifications',
  '0 * * * *',
  $$select public.generate_weekly_report_notifications();$$
);

-- ---------------------------------------------------------------------
-- Password-change security notifications
-- ---------------------------------------------------------------------

-- Fires on any real password change — both the forgot-password reset flow
-- and Settings -> Security's change-password flow call the same
-- supabase.auth.updateUser({password}), and either is the same real
-- security event. A trigger (not a client-side insert after the API call
-- succeeds) guarantees this can't be skipped by a network hiccup after a
-- successful change, and can't be spoofed by the client.
create or replace function public.notify_password_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    insert into public.notifications (user_id, type, title, message)
    values (
      new.id,
      'PASSWORD_RESET',
      'Password Reset Successful',
      'Your myWallet password was successfully changed.'
    );
  end if;
  return new;
end;
$$;

create trigger auth_users_notify_password_changed
  after update on auth.users
  for each row execute function public.notify_password_changed();

-- ---------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------

alter publication supabase_realtime add table public.notifications;
