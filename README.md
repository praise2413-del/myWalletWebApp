# myWallet

A personal finance web app that helps you record income and expenses, and turns that history into clear, explainable insight into where your money goes.

**RECORD → ORGANIZE → ANALYZE → UNDERSTAND**

myWallet isn't just a place to log transactions — it computes reports and generates plain-language, data-backed observations about your spending (descriptive, comparative, and behavioral), without judging your choices or pretending to be a financial adviser.

## Features (target scope)

- Email/password authentication with session persistence
- Fast income/expense entry with categories, notes, and dates
- Searchable, filterable, paginated transaction history
- Dashboard: balance, income, expenses, net cash flow, spending overview, recent activity, savings & investment allocation
- Reports: daily/weekly/monthly/yearly/custom periods, category distribution, spending trend, category comparison, income vs. expense, period-over-period comparison
- Insights: rule-based descriptive, comparative, behavioral, and savings/investment-allocation observations — never generative AI, never financial advice
- Savings & Investment Allocation: track money set aside as savings or investment (kept distinct from expenses), compare against a personal target (default 30%, configurable)
- Category management with sensible defaults and custom categories
- Light/dark/system theme, fully responsive (desktop/tablet/mobile)

See [docs/ui-design.md](docs/ui-design.md) for the design system, [docs/architecture.md](docs/architecture.md) for project structure, [docs/database.md](docs/database.md) for the schema, and [docs/insights.md](docs/insights.md) for the insights engine. Additional docs (`security`, `reports`, `testing`, `deployment`) are added as each phase lands.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS v4, React Router
- **Backend:** Supabase (Auth, PostgreSQL, Row Level Security) — no custom server, no direct DB credentials in the client
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **State:** Zustand (client/UI state); server data lives in Supabase and is fetched directly per view
- **Icons:** lucide-react

React never talks to PostgreSQL directly — all data access goes through the Supabase client (anon key), constrained by Row Level Security policies.

## Project structure

```
src/
├── app/           # router, providers (theme, etc.)
├── components/    # shared ui/, layout/, charts/
├── features/      # one folder per feature: dashboard, transactions, reports, insights, categories, settings
├── hooks/         # shared hooks
├── lib/           # supabase client, utils, validation, insights engine
├── types/         # shared TypeScript types
└── styles/        # global CSS lives in src/index.css
```

## Local setup

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

## Environment variables

| Variable                  | Description                          |
| -------------------------- | ------------------------------------- |
| `VITE_SUPABASE_URL`        | Your Supabase project URL             |
| `VITE_SUPABASE_ANON_KEY`   | Supabase anon/public API key          |

Never commit `.env`. Only the anon key belongs in the client — the service-role key must never be used in frontend code.

## Development commands

```bash
npm run dev       # start the dev server
npm run build     # type-check and build for production
npm run lint      # run oxlint
npm run test      # run unit tests (vitest)
npm run preview   # preview the production build locally
```

## Status

Built in phases (foundation → Supabase → auth → transactions → dashboard → reports → insights → categories → settings → quality → deployment).

- ✅ **Phase 1 — Foundation**: design system, routing, base layout.
- ✅ **Phase 2 — Supabase**: schema (`profiles`, `categories`, `transactions`, `allocations`) live on the real project, RLS on every table, new-user provisioning trigger.
- ✅ **Phase 3 — Authentication**: register/login/logout/forgot-reset/change-password, protected routes.
- ✅ **Savings & Investment Allocation** (pulled forward ahead of Phase 4 so later phases can be built with it from the start): schema, calculation/insight engine (with tests), Settings target field, Dashboard preview card. See `docs/insights.md`.
- ✅ **Phase 4 — Transactions**: full CRUD for income/expense transactions and savings/investment allocations (add/edit/delete, search, type/date filters, sort, pagination), real category data, RLS- and trigger-verified against the live database.
- ✅ **Phase 5 — Dashboard**: balance, income, expenses, net cash flow, spending overview, recent transactions, spending trend, and the savings/investment allocation card are all live Supabase queries (This Week/Month/Year, with period-over-period deltas and empty states) — no more mock data.
- ⏳ **Phase 6 onward** (Reports, Insights page, Categories CRUD UI, deployment): not started.
