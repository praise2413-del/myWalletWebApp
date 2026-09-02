# Database

PostgreSQL via Supabase. Source of truth for schema is `supabase/migrations/` — apply changes by adding a new migration file, never by hand-editing the live database.

## Tables

**`profiles`** — one row per user, `id` = `auth.users.id`. `full_name`, `currency` (default `'TZS'`).

**`categories`** — `user_id`, `name`, `type` (`INCOME` | `EXPENSE`), `icon`, `is_default`. Unique on `(user_id, name, type)`. Every user gets their own copy of the default category set (not shared/global rows) so they can freely rename or delete non-default ones without affecting anyone else.

**`transactions`** — `user_id`, `category_id`, `type`, `amount` (`numeric(14,2)`, `CHECK (amount > 0)`), `transaction_date`, `note`. Indexed on `user_id`, `category_id`, `transaction_date`, `type`.

## Enforcement that can't be a CHECK constraint

A transaction's `type` must match its category's `type`, and the category must belong to the same user. Postgres `CHECK` constraints can't do cross-table lookups, so this is a `BEFORE INSERT OR UPDATE` trigger: `enforce_transaction_category_type()`.

## New-user provisioning

`handle_new_user()` fires `AFTER INSERT ON auth.users` and, in one transaction, creates the `profiles` row and inserts all 20 default categories (13 expense + 7 income, matching the master spec exactly) for that user. This is why a fresh signup already has a full category list with zero setup.

## RLS

Every table has `ROW LEVEL SECURITY` enabled with `auth.uid() = user_id` (or `= id` for `profiles`) policies for select/insert/update, and delete besides `categories`, whose delete policy additionally requires `is_default = false` — default categories can be edited but not removed. See `docs/security.md` (added in the QA phase) for the full threat-model writeup; the policies themselves are the enforcement, not a UI convention.

## Applying migrations

```bash
SUPABASE_ACCESS_TOKEN=<personal access token> npx supabase link --project-ref ogmfpqzthuuquoxpkgqh
SUPABASE_ACCESS_TOKEN=<personal access token> npx supabase db push --linked
```

`db push` needs the database password interactively; when only an access token is available, migrations can instead be applied directly through the Management API's SQL endpoint (`POST /v1/projects/{ref}/database/query`, `Authorization: Bearer <token>`), which is how the initial migration was applied here.

After any schema change, regenerate types:

```bash
SUPABASE_ACCESS_TOKEN=<token> npx supabase gen types typescript --project-id ogmfpqzthuuquoxpkgqh > src/lib/supabase/database.types.ts
```
