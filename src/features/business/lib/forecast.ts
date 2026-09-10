import { buildIncomeStatement, type RawLedgerLine } from "@/features/business/lib/statements";
import { toDateKey } from "@/lib/utils/period";

export interface MonthlyTotal {
  monthKey: string; // 'YYYY-MM'
  monthLabel: string;
  revenue: number;
  expenses: number;
  netProfit: number;
}

/**
 * Revenue/expenses/net profit for each of the `monthsBack` most recently
 * *completed* months before `today` — deliberately excludes the current
 * in-progress month, since a partial month would understate activity and
 * skew any trend/average computed from it.
 */
export function buildMonthlyHistory(lines: RawLedgerLine[], monthsBack: number, today: string): MonthlyTotal[] {
  const todayDate = new Date(`${today}T00:00:00`);
  const results: MonthlyTotal[] = [];

  for (let i = monthsBack; i >= 1; i--) {
    const monthDate = new Date(todayDate.getFullYear(), todayDate.getMonth() - i, 1);
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const from = toDateKey(start);
    const to = toDateKey(end);
    const income = buildIncomeStatement(lines, from, to);

    results.push({
      monthKey: from.slice(0, 7),
      monthLabel: monthDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      revenue: income.totalRevenue,
      expenses: income.totalExpense,
      netProfit: income.netProfit,
    });
  }

  return results;
}

export type ForecastTrend = "up" | "down" | "flat";

export interface Forecast {
  projectedRevenue: number;
  projectedExpenses: number;
  projectedNetProfit: number;
  trend: ForecastTrend;
  monthsUsed: number;
}

/**
 * A simple moving average of however many completed months of history are
 * available (up to what was requested), not a fitted model — the basis is
 * meant to be obvious and checkable by the business owner, not a black
 * box. Trend compares the average of the newer half of the window against
 * the older half.
 */
export function buildForecast(history: MonthlyTotal[]): Forecast | null {
  const active = history.filter((h) => h.revenue !== 0 || h.expenses !== 0);
  if (active.length === 0) return null;

  const avg = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

  const projectedRevenue = avg(active.map((h) => h.revenue));
  const projectedExpenses = avg(active.map((h) => h.expenses));

  let trend: ForecastTrend = "flat";
  if (active.length >= 2) {
    const mid = Math.floor(active.length / 2);
    const olderHalf = active.slice(0, mid || 1);
    const newerHalf = active.slice(mid || 1);
    const olderAvg = avg(olderHalf.map((h) => h.netProfit));
    const newerAvg = avg(newerHalf.map((h) => h.netProfit));
    const base = Math.abs(olderAvg) < 0.005 ? Math.abs(newerAvg) : Math.abs(olderAvg);
    if (base > 0.005) {
      const change = (newerAvg - olderAvg) / base;
      trend = change > 0.05 ? "up" : change < -0.05 ? "down" : "flat";
    }
  }

  return {
    projectedRevenue,
    projectedExpenses,
    projectedNetProfit: projectedRevenue - projectedExpenses,
    trend,
    monthsUsed: active.length,
  };
}
