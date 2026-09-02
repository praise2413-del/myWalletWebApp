-- myWallet: self-service account deletion.
--
-- A regular authenticated client can never delete from auth.users directly
-- (it isn't exposed via PostgREST, and even if it were, RLS can't scope a
-- DELETE to "your own auth identity" the way it scopes app tables). A
-- SECURITY DEFINER function is the standard way to allow a user to delete
-- exactly their own account: auth.uid() is derived server-side from the
-- verified JWT, never client-supplied, so this can only ever delete the
-- caller's own row. Every app table (profiles, categories, transactions,
-- allocations) has `on delete cascade` back to auth.users, so this one
-- delete cleans up all of a user's data.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
