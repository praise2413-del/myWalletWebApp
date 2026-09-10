-- Real bug found via live testing: "Owners can update member roles" only
-- checked the *new* row's role wasn't OWNER (in WITH CHECK), never that
-- the *existing* row being updated wasn't already OWNER (USING had no
-- role condition at all). That let a business owner PATCH their own
-- OWNER business_members row to any other role — the underlying
-- privilege check (is_business_owner, keyed off businesses.owner_id, not
-- this role label) was never compromised, but the displayed/stored role
-- silently desynced from reality, breaking anything that reads
-- business_members.role to decide who's the owner (the Team page's
-- "Full access" badge and its owner-only action gating, for one).
--
-- Fix: USING must also exclude role = 'OWNER', so an OWNER row is never
-- even selected as a candidate for this UPDATE policy in the first
-- place — not just checked after the fact in WITH CHECK.

drop policy if exists "Owners can update member roles" on public.business_members;

create policy "Owners can update member roles" on public.business_members for update
  using (public.is_business_owner(business_id) and role <> 'OWNER')
  with check (public.is_business_owner(business_id) and role <> 'OWNER');
