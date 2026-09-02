# Architecture

## Overview

```
React (Vite, TypeScript)
   │  Supabase JS client (anon key only)
   ▼
Supabase
   ├── Auth
   ├── PostgreSQL (+ Row Level Security)
   ├── Database functions/views (for report aggregation)
   └── Storage (if/when needed)
```

React never holds database credentials and never queries PostgreSQL directly — everything goes through the Supabase client, and every table has RLS policies that enforce per-user ownership regardless of what the client sends. See `docs/database.md` for the schema and `docs/security.md` (added in the QA phase) for the full threat-model writeup.

## Frontend structure

```
src/
├── app/
│   ├── router/            # route table, lazy-loaded pages, RequireAuth/RequireGuest guards
│   └── providers/          # ThemeProvider, AuthProvider
├── components/
│   ├── ui/                 # generic, reusable primitives (Button, Card, Modal, SlideOver, Pagination, ...)
│   └── layout/               # app shell pieces (Sidebar, Topbar, MobileNav, MobileDrawer, PageHeader)
├── features/
│   └── <feature>/
│       ├── <Feature>Page.tsx
│       ├── components/       # components used only within this feature
│       └── hooks/             # data-fetching hooks used only within this feature
├── hooks/                     # cross-feature hooks (auth, theme, reduced motion, categories, toast, ...)
├── lib/
│   ├── utils/                  # cn, currency formatting, category color/icon mapping, period-range math
│   ├── validations/             # zod schemas per feature
│   ├── insights/                  # the rule-based insights engine (see docs/insights.md)
│   └── supabase/                   # typed Supabase client (types generated from the live schema)
└── types/                           # shared TypeScript types
```

Routes are code-split with `React.lazy` per feature page (`src/app/router/index.tsx`), so navigating the app only downloads the JS a given page needs.

## State management

- **Zustand** for small, persisted client UI state: theme mode (`useThemeStore`) and toast notifications (`useToastStore`).
- **Auth/session state** lives in `AuthProvider` (React context), exposing `session`, `user`, and `profile`.
- **Server state** (transactions, categories, allocations, dashboard aggregates) is fetched directly from Supabase per view via dedicated hooks (e.g. `useDashboardData`, `useTransactionsQuery`) — no separate client-side cache layer is introduced until a real need for one shows up.

## Data-fetching pattern

Each page/section that needs Supabase data owns a small hook that fetches, computes derived values (sums, percentages, groupings) client-side, and returns `{ data, loading, error }`. This is deliberately simple for the current data volumes a personal-finance MVP produces; if the Reports phase needs heavier aggregation, that's the point to introduce Postgres views/functions (see `docs/database.md`) rather than pulling and summing rows in the client.
