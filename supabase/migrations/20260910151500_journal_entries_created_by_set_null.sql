-- Fix found while testing Phase 2: journal_entries.created_by was declared
-- `on delete restrict` against auth.users, which blocks deleting a user
-- account (delete_own_account(), or the Management API) the moment they've
-- ever posted a journal entry — breaking the "every table cascades cleanly
-- back to auth.users" invariant already established for every other table
-- in this project (see the Phase 9 delete-account work). `on delete
-- cascade` isn't right either: created_by can be a non-owner business
-- member (ACCOUNTANT/MANAGER/SALES/CASHIER), and cascading would destroy
-- other members' financial records just because one member's account was
-- deleted. `on delete set null` preserves the entry and only drops
-- attribution.

alter table public.journal_entries alter column created_by drop not null;

alter table public.journal_entries
  drop constraint journal_entries_created_by_fkey,
  add constraint journal_entries_created_by_fkey
    foreign key (created_by) references auth.users (id) on delete set null;
