# Financial Insights

myWallet's insights are deterministic and rule-based — never generative AI, never invented from insufficient data, never phrased as financial advice. Every insight must be explainable: the user should never wonder where a number came from.

The engine lives in `src/lib/insights/` as small, pure, independently-tested functions per insight type, assembled by feature-specific data hooks. This document covers all of it: the three insight levels (descriptive, comparative, behavioral) and the Savings & Investment Allocation feature.

## The core principle: allocation ≠ expense

Money a user deliberately sets aside as savings or puts toward investment is **not** an expense. It's tracked in its own table (`allocations`, see `docs/database.md`) and reported separately everywhere: the expense pie chart, "Total Expenses," and expense-category insights must never include it. Conflating the two would make the user's expense figures look larger than their actual spending and would defeat the point of the feature — recognizing a positive financial behavior, not disguising it as consumption.

## Level 1 — Descriptive (`src/lib/insights/descriptive.ts`)

`generateDescriptiveInsights()` — plain facts read straight off the current month: total spent, largest expense category, income received, net cash flow. Never invents a comparison. Net cash flow is `positive` tone when ≥0, `attention` when expenses exceeded income (phrased factually — "Your expenses exceeded your recorded income" — never "you're overspending" or similar).

## Level 2 — Comparative (`src/lib/insights/comparative.ts`)

`generateComparativeInsights()` — this month vs. last month, for income, expenses, and the categories that moved the most (top 3 by absolute change). Requires real previous-period data for every comparison it makes — a category with no data in one of the two months is skipped rather than reported as a misleading "+∞%" or "-100%". Changes under 3% are treated as noise and omitted, so the page doesn't flag meaningless fluctuation as a pattern.

## Level 3 — Behavioral (`src/lib/insights/behavioral.ts`)

Four pattern detectors, each with its own minimum-data guard — every one returns `null` rather than guessing from a couple of records:

- `categoryStreakInsight` — the same category has been #1 for ≥3 consecutive months (reports the real streak length, not a hardcoded number).
- `consecutiveSpendingIncreaseInsight` — total monthly spending has risen for ≥3 consecutive months.
- `weekendVsWeekdayInsight` — needs ≥14 days of history; compares the *average spend per day of that type* (total ÷ count of that day-type in the range, not just days with a transaction), and requires the gap to be ≥15% of the higher average before calling it a pattern.
- `earlyMonthSpendingInsight` — needs ≥3 months with a known highest-spending day; only claims the pattern when a clear majority (≥60%) of those days fall in the first 10 days of their month.

## Savings & Investment Allocation

```
Savings & Investment Allocation % = (Total Savings + Total Investment) / Total Income × 100
```

Implemented in `src/lib/insights/allocation.ts`:

- `calculateAllocationRate(income, totalAllocated)` — safe against `income = 0` (returns `0`, never `NaN`/`Infinity`), rounds to one decimal place.
- `classifyAllocation(rate, target)` — maps a rate to a band. `rate > target` → `exceeded`; `rate === target` → `reached` (both `positive` tone); below target: `20–29.9%` → `good-progress`, `10–19.9%` → `building-habit`, `<10%` → `overview` (all `observation` tone). The 20%/10% band boundaries are fixed reference points, independent of the user's own configurable target — only the pass/fail line moves with the target.
- `getAllocationInsight(input)` — the entry point. Returns a discriminated result: `no-income` (income ≤ 0), `no-allocation` (income exists, nothing allocated), or `calculated` (full `AllocationCalculation` + a ready-to-render `Insight`, whose `comparison` field always shows the allocated amount, income, and target — the explainability requirement).

Historical patterns live in `src/lib/insights/allocationHistory.ts`: a consecutive-increase streak (needs ≥3 periods), a rolling average (needs a full window, default 6 periods), and a target-hit count (needs a full window, default 5 periods).

Stored target: `profiles.allocation_target` (default `30`), editable in Settings → Preferences → "Savings & Investment Target." Never hard-coded elsewhere — every consumer reads it from the user's profile.

## Insight tone rules

- **Positive**: something favorable — income up, spending down, allocation target reached/exceeded.
- **Observation**: neutral facts and below-target allocation. Never framed as failure — copy always stays supportive ("Good progress," "You're building the habit"), never "poor," "bad," or similar.
- **Attention** is for genuinely important situations — spending up, expenses exceeding income, an allocation-target-adjacent category trending the wrong way. Not a verdict, just a flag worth noticing.

No insight anywhere in the app recommends a specific financial product, stock, cryptocurrency, or institution. The system tracks and explains the user's own recorded behavior; it is not a financial adviser.

## Where this shows up

- **Dashboard**: a single descriptive teaser (`getTopCategoryInsight`, `src/lib/insights/spending.ts` — largest category this period, no invented comparison) in the "Financial Insight" card, and the full `AllocationCard`. Both live since Phase 5.
- **Reports**: allocation total/rate/target/status for the selected report period (daily/weekly/monthly/yearly/custom), computed only from that period's data. Live since Phase 6 — see `docs/reports.md`.
- **Insights page** (`src/features/insights/`, Phase 7): the complete picture — Spending (descriptive), Comparison, Behavioral, and Savings & Investment sections, each with its own honest empty state when there isn't enough data yet. `useInsightsData` fetches a 6-month trailing window once and derives every section from it (monthly buckets for the streaks/comparisons, a flat daily-expense map for the weekend/weekday check, per-month allocation rates for the allocation history functions).
- **Transaction recording**: "Savings & Investment" tab and `AllocationFormModal` on the Transactions page, alongside Add Income/Add Expense.

## Testing

Each module has its own test file (`descriptive.test.ts`, `comparative.test.ts`, `behavioral.test.ts`, `allocation.test.ts`) — 58 tests total (`npm run test`), covering the spec's worked examples, insufficient-data guards (every "needs N periods" threshold is tested on both sides), and assertions that generated copy never uses shaming language or names a specific financial product. Verified live against the database with a 6-month seeded dataset engineered to trigger every pattern at once; every number the page displayed was cross-checked against an independent computation and matched exactly.
