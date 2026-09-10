-- Real bug found while cleaning up Phase 9 test accounts — same class as
-- the Phase 4 cascade-delete bug: log_member_change() fires during a
-- *cascade* delete (deleting a business, or delete_own_account()
-- cascading auth.users -> businesses -> business_members) and tries to
-- INSERT a new activity_log row referencing that business_id — but by
-- the time the cascade reaches business_members, the businesses row it
-- would reference may already be gone, tripping activity_log's own FK
-- constraint ("Key (business_id)=(...) is not present in table
-- businesses"). Logging "member removed" during a whole-business
-- deletion is pointless anyway (nothing will ever read that log again).
--
-- Same fix as Phase 4: pg_trigger_depth() <= 1 only logs a *direct*
-- top-level role change/removal, never one happening as a side effect of
-- a cascade.

create or replace function public.log_member_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    if TG_OP = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

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
