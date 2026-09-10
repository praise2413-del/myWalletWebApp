-- Lets a business owner delete a business outright (e.g. it closed down).
-- Every business-scoped table already has `business_id references
-- businesses(id) on delete cascade` (established in every migration
-- since Phase 1), so this one policy is enough to clean up everything
-- scoped to that business — accounts, journal entries, sales, purchases,
-- budgets, goals, team membership, activity log, all of it — while never
-- touching any other business the user owns or their own auth.users row
-- (the FK runs the other way: deleting a *user* cascades to their
-- businesses, not the reverse).
--
-- Owner-only, matching every other owner-gated action in this module.

create policy "Owners can delete their businesses"
  on public.businesses for delete
  using (public.is_business_owner(id));
