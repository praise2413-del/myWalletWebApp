import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { buildBusinessHealth } from "@/features/business/lib/businessHealth";
import { buildForecast, buildMonthlyHistory } from "@/features/business/lib/forecast";
import { buildGuidanceInsights, type BudgetOverrun } from "@/features/business/lib/guidance";
import { buildBusinessRatios } from "@/features/business/lib/ratios";
import { applyScenario } from "@/features/business/lib/scenario";
import { buildBalanceSheet, buildIncomeStatement } from "@/features/business/lib/statements";
import { useBudgets } from "@/features/business/hooks/useBudgets";
import { useBusinessLedgerLines } from "@/features/business/hooks/useBusinessLedgerLines";
import { useUpcomingPayments } from "@/features/business/hooks/useUpcomingPayments";
import { InsightCard } from "@/features/insights/components/InsightCard";
import { useBusiness } from "@/hooks/useBusiness";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { getPeriodRange, toDateKey, todayDateKey } from "@/lib/utils/period";

type Tab = "FORECAST" | "SCENARIO" | "GUIDANCE";

const TABS: { id: Tab; label: string }[] = [
  { id: "FORECAST", label: "Forecast" },
  { id: "SCENARIO", label: "Scenario Planner" },
  { id: "GUIDANCE", label: "Guidance" },
];

function MonthBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percent = max > 0 ? Math.max(2, Math.min(100, (Math.abs(value) / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-text-tertiary">{label}</span>
        <span className="font-medium text-text-primary">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function BusinessForecastPage() {
  const { activeBusiness } = useBusiness();
  const currency = activeBusiness?.currency ?? "TZS";
  const { lines, loading, error } = useBusinessLedgerLines();
  const [tab, setTab] = useState<Tab>("FORECAST");

  const today = todayDateKey();
  const history = useMemo(() => buildMonthlyHistory(lines, 6, today), [lines, today]);
  const forecast = useMemo(() => buildForecast(history), [history]);
  const maxAbs = Math.max(1, ...history.flatMap((h) => [h.revenue, h.expenses]));

  const [revenueChange, setRevenueChange] = useState(0);
  const [expenseChange, setExpenseChange] = useState(0);
  const baselineRevenue = forecast?.projectedRevenue ?? 0;
  const baselineExpenses = forecast?.projectedExpenses ?? 0;
  const scenario = useMemo(
    () => applyScenario({ baselineRevenue, baselineExpenses, revenueChangePercent: revenueChange, expenseChangePercent: expenseChange }),
    [baselineRevenue, baselineExpenses, revenueChange, expenseChange],
  );

  // Guidance data
  const now = new Date();
  const { budgets } = useBudgets(now.getMonth() + 1, now.getFullYear());
  const { payments } = useUpcomingPayments();
  const thisMonth = useMemo(() => getPeriodRange("This Month"), []);
  const dateTo = toDateKey(thisMonth.end);
  const dateFrom = toDateKey(thisMonth.start);

  const guidance = useMemo(() => {
    const bs = buildBalanceSheet(lines, dateTo);
    const is = buildIncomeStatement(lines, dateFrom, dateTo);
    const ratios = buildBusinessRatios(lines, dateTo, bs, is);
    const health = buildBusinessHealth(ratios);

    const budgetOverruns: BudgetOverrun[] = budgets
      .map((b) => {
        const actual = lines
          .filter((l) => l.accountId === b.accountId && l.entryDate >= dateFrom && l.entryDate <= dateTo)
          .reduce((sum, l) => sum + l.debit - l.credit, 0);
        return { accountName: b.accountName, actual, budgeted: b.amount };
      })
      .filter((b) => b.actual > b.budgeted);

    const overduePayments = payments.filter((p) => p.dueDate < today);
    const overduePayables = overduePayments.filter((p) => p.kind === "PAYABLE");
    const overdueReceivables = overduePayments.filter((p) => p.kind === "RECEIVABLE");

    return buildGuidanceInsights({
      health,
      forecast,
      budgetOverruns,
      overduePayables: { count: overduePayables.length, total: overduePayables.reduce((sum, p) => sum + p.remaining, 0) },
      overdueReceivables: { count: overdueReceivables.length, total: overdueReceivables.reduce((sum, p) => sum + p.remaining, 0) },
      currency,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, budgets, payments, forecast, dateFrom, dateTo, currency, today]);

  return (
    <div>
      <PageHeader title="Forecast & Guidance" description="A simple trend-based forecast, a what-if scenario calculator, and rule-based guidance — no generative AI, every number traceable back to your books." />

      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t.id ? "bg-primary-600 text-white" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-expense-600">{error}</p>
      ) : loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          {tab === "FORECAST" && (
            <div className="space-y-4">
              {!forecast ? (
                <EmptyState icon={TrendingUp} title="Not enough history yet" description="Forecasts need at least one fully completed month of posted journal activity." />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card className="p-5">
                      <p className="text-sm font-medium text-text-secondary">Projected Revenue</p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{formatCurrency(forecast.projectedRevenue, currency)}</p>
                      <p className="mt-2 text-xs text-text-tertiary">Average of last {forecast.monthsUsed} completed {forecast.monthsUsed === 1 ? "month" : "months"}</p>
                    </Card>
                    <Card className="p-5">
                      <p className="text-sm font-medium text-text-secondary">Projected Expenses</p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{formatCurrency(forecast.projectedExpenses, currency)}</p>
                      <p className="mt-2 text-xs text-text-tertiary">Next month, same basis</p>
                    </Card>
                    <Card className="p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-text-secondary">Projected Net Profit</p>
                        {forecast.trend !== "flat" && (
                          <Badge tone={forecast.trend === "up" ? "income" : "expense"}>
                            {forecast.trend === "up" ? <TrendingUp className="size-3" aria-hidden="true" /> : <TrendingDown className="size-3" aria-hidden="true" />}
                          </Badge>
                        )}
                      </div>
                      <p className={cn("mt-2 text-2xl font-bold tracking-tight", forecast.projectedNetProfit >= 0 ? "text-income-600" : "text-expense-600")}>
                        {formatCurrency(forecast.projectedNetProfit, currency)}
                      </p>
                      <p className="mt-2 text-xs text-text-tertiary">Trend: {forecast.trend}</p>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent History</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {history.filter((h) => h.revenue !== 0 || h.expenses !== 0).map((h) => (
                        <div key={h.monthKey} className="space-y-1.5">
                          <p className="text-xs font-medium text-text-secondary">{h.monthLabel}</p>
                          <MonthBar label="Revenue" value={h.revenue} max={maxAbs} color="bg-income-500" />
                          <MonthBar label="Expenses" value={h.expenses} max={maxAbs} color="bg-expense-500" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {tab === "SCENARIO" && (
            <div className="space-y-4">
              {!forecast ? (
                <EmptyState icon={TrendingUp} title="Not enough history yet" description="The scenario planner starts from your forecasted revenue and expenses." />
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Adjust the assumptions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <label htmlFor="revenue-slider" className="font-medium text-text-secondary">Revenue change</label>
                          <span className="font-semibold text-text-primary">{revenueChange > 0 ? "+" : ""}{revenueChange}%</span>
                        </div>
                        <input id="revenue-slider" type="range" min={-50} max={50} step={1} value={revenueChange} onChange={(e) => setRevenueChange(Number(e.target.value))} className="w-full accent-primary-600" />
                      </div>
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <label htmlFor="expense-slider" className="font-medium text-text-secondary">Expense change</label>
                          <span className="font-semibold text-text-primary">{expenseChange > 0 ? "+" : ""}{expenseChange}%</span>
                        </div>
                        <input id="expense-slider" type="range" min={-50} max={50} step={1} value={expenseChange} onChange={(e) => setExpenseChange(Number(e.target.value))} className="w-full accent-primary-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card className="p-5">
                      <p className="text-sm font-medium text-text-secondary">Scenario Revenue</p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{formatCurrency(scenario.revenue, currency)}</p>
                    </Card>
                    <Card className="p-5">
                      <p className="text-sm font-medium text-text-secondary">Scenario Expenses</p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{formatCurrency(scenario.expenses, currency)}</p>
                    </Card>
                    <Card className="p-5">
                      <p className="text-sm font-medium text-text-secondary">Scenario Net Profit</p>
                      <p className={cn("mt-2 text-2xl font-bold tracking-tight", scenario.netProfit >= 0 ? "text-income-600" : "text-expense-600")}>
                        {formatCurrency(scenario.netProfit, currency)}
                      </p>
                      <p className="mt-2 text-xs text-text-tertiary">
                        {scenario.netProfitChange >= 0 ? "+" : ""}
                        {formatCurrency(scenario.netProfitChange, currency)} vs. baseline forecast
                      </p>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "GUIDANCE" && (
            <div className="space-y-3">
              {guidance.map((g) => (
                <InsightCard key={g.id} insight={g} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
