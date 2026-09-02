# Security

## Threat model

myWallet stores personal financial data (income, expenses, savings/investment amounts). The two things that matter most: a user's data must be unreachable by any other user, and the client must never be trusted to enforce that on its own — every guarantee below is enforced server-side, not just hidden in the UI.

## No custom backend, no service-role key

React talks to Supabase directly with the **anon/publishable key only**. There is no server component and no service-role key anywhere in the client, in git history, or in build output — a leaked anon key gives an attacker nothing beyond what Row Level Security already allows an authenticated (or anonymous) user to do. `.env` is gitignored; only `.env.example` (no real values) is committed.

## Row Level Security is the actual enforcement layer

Every table (`profiles`, `categories`, `transactions`, `allocations`) has RLS enabled with `auth.uid() = user_id` (or `= id` for `profiles`) policies for select/insert/update/delete. This means even if a UI bug or a hand-crafted REST request tried to read or write another user's row, Postgres itself refuses it — the app-level filtering (`.eq("user_id", user.id)` in every query) is a convenience, not the actual security boundary. Full policy list in `docs/database.md`.

## Defense-in-depth beyond RLS: triggers for cross-row invariants

RLS can express "this row belongs to you" but can't express "this row is internally consistent with that row," so three invariants that matter for correct financial totals are enforced by triggers instead, and were each verified live by attempting the exact bypass they close (not just read from the code):

- **`enforce_transaction_category_type`** — a transaction's `type` must match its category's `type`, and the category must belong to the same user. Checked at insert/update time.
- **`prevent_category_lock_violation`** (added in the QA phase, after finding the gap by testing direct REST calls rather than only the UI) — blocks changing a category's `type` or `is_default` after creation via a direct `PATCH`. Without this, RLS alone would have let a user flip a default category's `is_default` to `false` and then delete it — defeating the "default categories can't be deleted" rule the delete policy is supposed to enforce — or silently change a category's `type` out from under transactions already filed under it. Both are self-only-affecting data-integrity bugs (RLS still blocks cross-user access) but were real, directly exploitable via `curl`, not hypothetical.
- **`handle_new_user`** — provisions a profile + default categories on signup, `SECURITY DEFINER` so it can write to `public.profiles`/`public.categories` on the new user's behalf before that user's own RLS context would normally allow it.

## Self-service account deletion

A regular client can never delete its own `auth.users` row directly (not exposed via PostgREST; RLS can't scope "delete your own auth identity"). `delete_own_account()` is a `SECURITY DEFINER` function that runs `delete from auth.users where id = auth.uid()` — safe because `auth.uid()` is derived server-side from the verified JWT and can never be supplied by the client, so this can only ever delete the caller's own account. Every table cascades from `auth.users`, so this one call also removes the profile and all categories/transactions/allocations. See `docs/database.md`.

## XSS / injection

- React escapes all rendered text by default; `dangerouslySetInnerHTML` is not used anywhere in the codebase.
- All database access goes through the Supabase client's parameterized query builder — no raw/interpolated SQL is ever built from user input in the client.
- Error messages shown to the user go through `friendlyDbError`/`friendlyAuthError` (`src/lib/utils/`), which map known Postgres/Auth error substrings to plain-language copy — this also means raw database error text (table/column names, constraint internals) never reaches the UI.

## External links

The Terms/Privacy links on the signup form use `target="_blank"` with `rel="noopener noreferrer"`, preventing the opened page from getting a handle back to `window.opener` (reverse tabnabbing).

## Auth email confirmation — accepted dev-stage trade-off

Documented in the README: `mailer_autoconfirm` is currently `true` because Supabase's built-in email service proved unreliable/rate-limited for real signup delivery during development. This means anyone can currently sign up with any email address they don't need to own. **Before real users sign up**, this needs a real SMTP provider configured and email confirmation turned back on — tracked as a known gap, not silently forgotten.

## Not implemented (out of scope for this MVP)

- Two-factor authentication — not in the master spec.
- CAPTCHA/bot-mitigation on signup — relying on Supabase Auth's own rate limiting for now.
- A formal Content-Security-Policy header — the app is a static SPA build with no inline scripts, but no CSP has been explicitly configured at the hosting layer yet; revisit during deployment (Phase 11).
