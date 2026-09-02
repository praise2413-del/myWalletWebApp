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

React never holds database credentials and never queries PostgreSQL directly — everything goes through the Supabase client, and every table has RLS policies that enforce per-user ownership regardless of what the client sends. See `docs/database.md` and `docs/security.md` once Supabase is wired up (Phase 2).

## Frontend structure

```
src/
├── app/
│   ├── router/          # route table, lazy-loaded pages
│   └── providers/        # ThemeProvider, etc.
├── components/
│   ├── ui/               # generic, reusable primitives (Button, Card, Badge, EmptyState, Skeleton, ...)
│   └── layout/            # app shell pieces (Sidebar, Topbar, MobileNav, MobileDrawer, PageHeader)
├── features/
│   └── <feature>/
│       ├── <Feature>Page.tsx
│       └── components/    # components used only within this feature
├── hooks/                 # cross-feature hooks (theme, reduced motion, ...)
├── lib/
│   ├── utils/              # cn, currency formatting, category color/icon mapping
│   ├── data/                # static reference data (default categories)
│   ├── mock/                 # placeholder data for features not yet wired to Supabase — deleted feature by feature as real queries land
│   └── supabase/              # Supabase client (added in Phase 2)
└── types/                      # shared TypeScript types
```

Routes are code-split with `React.lazy` per feature page (`src/app/router/index.tsx`), so navigating the app only downloads the JS a given page needs.

## State management

- **Zustand** for small, persisted client UI state (currently: theme mode, in `useThemeStore`, persisted to `localStorage`).
- **Server state** (transactions, categories, reports) is fetched directly from Supabase per view; no separate client-side cache layer is introduced until a real need for one shows up.

## Why mock data exists right now

Phase 1 (this phase) builds the design system, routing, and layout before Supabase exists. `src/lib/mock/` holds realistic placeholder data so pages — especially the Dashboard — can be built and visually verified against the design reference immediately. Each mock file is deleted once its feature is wired to real Supabase queries; `src/lib/data/defaultCategories.ts` is the one exception, since it's genuine seed data reused by the Categories page now and the Supabase seed migration later (Phase 2), not a mock.
