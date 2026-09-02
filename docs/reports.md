# Reports & Analytics

`src/features/reports/` — `useReportsData` (the query/calculation hook) plus a set of focused card components assembled by `ReportsPage`.

## Periods

Five period types (`daily | weekly | monthly | yearly | custom`), computed by `getReportPeriodRange` in `src/lib/utils/period.ts` — the same module the Dashboard uses (`getPeriodRange`), sharing the month-length-safe "previous period" logic that Phase 5 found and fixed a real bug in. `custom` takes an explicit `{ start, end }` and compares against an **equal-length window immediately preceding it** (a 10-day custom range compares against the 10 days before it — not a fixed calendar unit). The trend chart buckets by day normally, switching to monthly buckets once a range exceeds ~62 days (so a full-year custom range doesn't try to render 365 daily points).

## Calculations

Everything is computed client-side in `useReportsData` from two Supabase queries (transactions with their category joined, allocations) scoped to `[previousStart, end]`, then split at the period boundary — the same pattern as `useDashboardData`. Derived from that:

- **Income / Expenses / Net Cash Flow** — summed for the current window, compared against the previous window via `percentChange` (handles the 0→0 and 0→N edge cases without NaN/Infinity).
- **Average daily expense** — `expenses / numberOfDaysInPeriod`.
- **Highest spending category / highest spending day** — plain descriptive facts, surfaced as sentences in `ReportHighlights`, never left for the user to read off a chart (spec: "do not force users to interpret charts themselves").
- **Category distribution** (pie) and **category comparison** (bar) both use `groupTopCategories` (`src/lib/utils/aggregate.ts`) — top 5 for the pie (readability), top 8 for the bar. The **detailed breakdown table** uses the full, ungrouped category list, so the data folded into "Other" on the charts is never actually lost.
- **Category changes** — every category present in either the current or previous window, ranked by absolute change and capped at 4, so the comparison highlights what actually moved rather than listing every category.
- **Savings & Investment** — reuses the exact same allocation engine as the Dashboard (`src/lib/insights/allocation.ts`) and the same `AllocationCard` component, scoped to the report's period instead of the dashboard's.

The expense pie chart stays expense-only, never including allocations — see `docs/insights.md` for why that separation matters.

## Chart ordering gotcha

Recharts renders the **first** item of a vertical-layout (`layout="vertical"`) `BarChart`'s data at the **top** of the category axis, not the bottom. `CategoryComparisonCard` sorts descending (largest first) for that reason — sorting ascending, which reads naturally in code, silently puts the smallest category on top. Caught by rendering against real seeded data, not from reading the chart code.

## Verification

Like Phases 4 and 5, this was checked against the live database with a seeded test account: every number on a Monthly report (income, expenses, net cash flow, deltas, average daily expense, highest category/day, category totals, allocation rate) was cross-checked against an independent SQL computation and matched exactly, and Daily/Weekly/Yearly/Custom Range were each verified by rendering the real page.
