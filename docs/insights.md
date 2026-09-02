# Financial Insights

myWallet's insights are deterministic and rule-based — never generative AI, never invented from insufficient data, never phrased as financial advice. Every insight must be explainable: the user should never wonder where a number came from.

This document currently covers the **Savings & Investment Allocation** insight, the first piece of the insights engine to be built (`src/lib/insights/`). The broader descriptive/comparative/behavioral spending insights (Phase 7) will be documented here as they land.

## The core principle: allocation ≠ expense

Money a user deliberately sets aside as savings or puts toward investment is **not** an expense. It's tracked in its own table (`allocations`, see `docs/database.md`) and reported separately everywhere: the expense pie chart, "Total Expenses," and expense-category insights must never include it. Conflating the two would make the user's expense figures look larger than their actual spending and would defeat the point of the feature — recognizing a positive financial behavior, not disguising it as consumption.

## Calculation

```
Savings & Investment Allocation % = (Total Savings + Total Investment) / Total Income × 100
```

Implemented in `src/lib/insights/allocation.ts`:

- `calculateAllocationRate(income, totalAllocated)` — safe against `income = 0` (returns `0`, never `NaN`/`Infinity`), rounds to one decimal place.
- `classifyAllocation(rate, target)` — maps a rate to a band. `rate > target` → `exceeded`; `rate === target` → `reached` (both `positive` tone); below target: `20–29.9%` → `good-progress`, `10–19.9%` → `building-habit`, `<10%` → `overview` (all `observation` tone). The 20%/10% band boundaries are fixed reference points, independent of the user's own configurable target — only the pass/fail line moves with the target.
- `getAllocationInsight(input)` — the entry point. Returns a discriminated result: `no-income` (income ≤ 0), `no-allocation` (income exists, nothing allocated), or `calculated` (full `AllocationCalculation` + a ready-to-render `Insight`, whose `comparison` field always shows the allocated amount, income, and target — the explainability requirement).

Historical/behavioral patterns live in `src/lib/insights/allocationHistory.ts`: a consecutive-increase streak (needs ≥3 periods), a rolling average (needs a full window, default 6 periods), and a target-hit count (needs a full window, default 5 periods). Each returns `null` rather than guessing when there isn't enough history — never draw a pattern from one or two data points.

Tested in `src/lib/insights/allocation.test.ts` (`npm run test`), including the exact worked examples from the spec (30%/35%/25%/multi-allocation-sums-to-30%), the zero-income edge case, and assertions that the generated copy never uses shaming language or recommends a specific financial product.

## Target

Stored as `profiles.allocation_target` (default `30`), editable in Settings → Preferences → "Savings & Investment Target." Never hard-coded elsewhere — every consumer reads it from the user's profile.

## Insight tone rules

- **Positive**: target reached or exceeded.
- **Observation**: below target, at any of the three bands above. Never framed as failure — copy always stays supportive ("Good progress," "You're building the habit," "Allocation overview"), never "poor," "bad," or similar.
- **Attention** is reserved for genuinely important situations (e.g. expenses significantly exceeding income) — the allocation target itself is a personal goal, not a rule the user can "fail," so it never produces an Attention-tier insight.

No insight — allocation or otherwise — recommends a specific financial product, stock, cryptocurrency, or institution. The system tracks and explains the user's own recorded behavior; it is not a financial adviser.

## Where this shows up

- **Dashboard**: `AllocationCard` (`src/features/dashboard/components/AllocationCard.tsx`) — percentage, allocated/income amounts, a progress bar with a target marker, and the current status. Links to the Insights page. Currently rendered with mock data pending Phase 4/5 (real transaction/allocation recording and live dashboard queries).
- **Insights page** (Phase 7, not yet built): a dedicated "Savings & Investment" section alongside descriptive/comparative/behavioral insights.
- **Reports** (Phase 6, not yet built): allocation total/rate/target/status for the selected report period — daily/weekly/monthly/yearly/custom, computed only from that period's income and allocations, never mixed across periods.
- **Transaction recording** (Phase 4, not yet built): a saving/investment allocation entry point alongside Add Income/Add Expense — planned as part of Phase 4, not a separate mini-app.
