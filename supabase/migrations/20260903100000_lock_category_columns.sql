-- The "Users can update own categories" RLS policy only checks ownership
-- (auth.uid() = user_id) — it has no way to say "except these columns."
-- That left two real gaps a client could hit directly via the REST API,
-- bypassing the UI's own restrictions entirely:
--
--   1. PATCH a default category's is_default to false, then delete it —
--      defeating the "default categories can't be deleted" protection,
--      since the delete policy only checks is_default at delete time.
--   2. PATCH a category's type after transactions already reference it —
--      the enforce_transaction_category_type trigger only validates a
--      transaction's type against its category at transaction insert/
--      update time, so existing transactions wouldn't be revalidated,
--      silently desyncing income/expense totals for that category.
--
-- Both are only-affects-your-own-data bugs (RLS still stops cross-user
-- access), not account takeovers — but they undermine features the app
-- deliberately built (default-category protection, type immutability)
-- if left enforceable only in the UI. A trigger is the right tool here
-- since RLS policies can't compare OLD vs NEW column values directly.

create or replace function public.prevent_category_lock_violation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.type <> old.type then
    raise exception 'A category''s type cannot be changed after creation';
  end if;
  if new.is_default <> old.is_default then
    raise exception 'A category''s default status cannot be changed';
  end if;
  return new;
end;
$$;

create trigger categories_prevent_lock_violation
  before update on public.categories
  for each row execute function public.prevent_category_lock_violation();
