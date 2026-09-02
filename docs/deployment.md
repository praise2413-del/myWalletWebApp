# Deployment

myWallet is a static single-page app (Vite build output, no server component) talking directly to Supabase. It deploys to **Vercel**.

## One-time setup (do this in the Vercel dashboard — needs your own account)

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → select `praise2413-del/myWalletWebApp`.
2. Vercel auto-detects the Vite framework preset. `vercel.json` (checked into the repo) already pins the exact build command (`npm run build`, i.e. `tsc -b && vite build` — type-checked, not just `vite build`), the output directory (`dist`), the SPA rewrite (every route serves `index.html` so client-side routing on a hard refresh/direct link doesn't 404), security headers, and long-lived caching for fingerprinted assets — nothing to configure by hand there.
3. **Environment variables** (Project Settings → Environment Variables), for all three environments (Production/Preview/Development):
   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon/publishable key |

   Same two values as local `.env` — see `.env.example`. Never paste the service-role key anywhere; this app never uses it (see `docs/security.md`).
4. Deploy. Every push to `main` auto-deploys to production; every other branch/PR gets its own preview URL.

## Required after the first deploy: tell Supabase about the new URL

Supabase Auth validates every `redirectTo` (used by the password-reset flow, `src/features/auth/ForgotPasswordPage.tsx`) against the project's configured **Site URL** and **Redirect URL allow list** — anything not on that list silently falls back to the default Site URL instead. Right now those are still the local-dev defaults (`http://localhost:3000`, empty allow list), so **password reset will send users to the wrong place until this is updated**:

1. Supabase dashboard → Authentication → URL Configuration.
2. Set **Site URL** to the production domain (e.g. `https://mywallet.vercel.app` or your custom domain).
3. Add both the production domain and `https://*.vercel.app` (or each preview URL as needed) to **Redirect URLs**.

This can also be done via the Management API the same way migrations were applied in this project (see `docs/database.md`) — `PATCH /v1/projects/{ref}/config/auth` with `{"site_url": "...", "uri_allow_list": "..."}`.

## Before real users sign up

`mailer_autoconfirm` is currently `true` (documented in the README and `docs/security.md`) because Supabase's default email service proved unreliable during development. This is fine for continued testing but means anyone can sign up with an email they don't own. Before this app is used by real people:

1. Configure a real SMTP provider (Supabase dashboard → Project Settings → Auth → SMTP Settings).
2. Set `mailer_autoconfirm` back to `false`.
3. Send yourself a real signup and password-reset email end-to-end to confirm delivery before flipping the switch.

## HTTPS

Automatic — every Vercel deployment (including preview URLs and custom domains) gets a free TLS certificate with no configuration needed.

## Post-deploy checklist

- [ ] Environment variables set for Production (and Preview, if you want preview deploys to work against the same Supabase project).
- [ ] Supabase Site URL / Redirect URLs updated to the real domain (see above) — test the "forgot password" flow end-to-end after this.
- [ ] Sign up, log in, add a transaction, check the dashboard/reports/insights load with real data.
- [ ] Confirm the browser's dev-tools Console/Network tab shows no CSP violations (the `Content-Security-Policy` header in `vercel.json` is scoped to exactly what the app actually loads — Supabase, Google Fonts, same-origin assets; if a future dependency needs a new external origin, that header needs updating too, not just the code).
- [ ] `docs/security.md`'s "not implemented" list is still accurate for the current deployment (2FA, CAPTCHA, etc.) — revisit if this moves from a personal project toward real users.
