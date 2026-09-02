# Testing

## Automated tests

`npm run test` runs the vitest suite — pure-function unit tests, no DOM/component rendering, no network. Covers:

- **Insights engine** (`src/lib/insights/*.test.ts`) — descriptive, comparative, behavioral, and allocation insight logic, including the "needs N periods of history" gating that every insight function follows (see `docs/insights.md`).
- **Period/date-range math** (`src/lib/utils/period.test.ts`) — dashboard/report period boundaries, specifically month-length and leap-year edge cases (this class of bug — `subMonths` silently landing on the wrong day near a shorter/longer month — caused a real bug found during Phase 5; see the build-progress notes).
- **Formatting** (`src/lib/utils/currency.test.ts`) — currency/percent formatting, sign handling, and that NaN/Infinity never reach the rendered UI (a financial app rendering "NaN" or "Infinity%" from a divide-by-zero is the kind of bug that erodes trust fast).
- **Aggregation** (`src/lib/utils/aggregate.test.ts`) — the top-N-plus-"Other" category grouping shared by Dashboard/Reports charts.
- **Error-message mapping** (`src/lib/utils/dbErrors.test.ts`, `authErrors.test.ts`) — every known Postgres/Auth error substring maps to the intended plain-language copy; these are cheap, high-value tests specifically because a new `if (lower.includes(...))` case added later can silently shadow or fail to match an existing one without a test catching it.

Run: `npm run test` (or `npm run test -- --watch` while developing).

## What's deliberately not automated (yet)

There is no component-rendering test suite (React Testing Library, etc.) or checked-in end-to-end browser suite. Given the size of the team (one person + Claude) and the project's stage, the cost of maintaining a full component/e2e suite outweighed its value so far — see the live-verification approach below instead, which has caught every real bug found in this project to date (the month-length date bug, the recharts vertical-bar-chart ordering bug, the category-icon-by-name-instead-of-slug bug, and the category-lock RLS gap were all found this way, not by a test suite). Revisit if the project grows a second contributor or the manual-verification cost starts exceeding a real suite's.

## Live-verification methodology (used every phase, not checked into the repo)

Every feature phase was verified against the real, live Supabase project before being considered done — not just type-checked and unit-tested:

1. Create a real (disposable) test user via the Auth REST API, seed realistic data via direct REST calls (as that user, respecting RLS — never with elevated keys).
2. Drive the actual app two ways: (a) direct REST calls replicating the app's exact queries, to check RLS/triggers/constraints server-side independent of any UI bug; (b) a temporary `e2e.html` + `src/e2e-main.tsx` harness (never committed) that calls `supabase.auth.setSession()` then renders the real `App`, driven by `puppeteer-core` against a real headless Chrome — real screenshots and real DOM interaction, not a mock.
3. Cross-check every displayed number against an independent computation (Python/SQL), not just "does it look plausible."
4. Delete the test user (cascades clean up everything) and the two harness files before committing.

This is slower per-phase than trusting types + unit tests alone, but it is what actually found the bugs listed above — several of which passed `tsc`, lint, and unit tests cleanly while still being wrong.

## Manual/exploratory checks worth re-running after significant changes

- **Keyboard/focus**: every `Modal`/`SlideOver`/`MobileDrawer` should move focus in on open, trap Tab/Shift+Tab within itself, close on Escape, and restore focus to whatever triggered it on close (`src/hooks/useFocusTrap.ts`, added in the QA phase after finding the app's dialogs had none of this).
- **Reduced motion**: chart entrance animations respect `usePrefersReducedMotion` — also incidentally what makes headless-Chrome chart screenshots reliable (see the build-progress notes).
- **Empty states**: every data view (dashboard cards, reports, insights, categories, transactions) has a real empty state for a brand-new account with zero data, not just a spinner or blank space.
