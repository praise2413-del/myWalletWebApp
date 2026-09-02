import { eachDayOfInterval, eachMonthOfInterval, isSameMonth, isToday, isYesterday } from "date-fns";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { groupTopCategories, type NamedAmount } from "@/lib/utils/aggregate";
import { getPeriodRange, percentChange, toDateKey, type DashboardPeriod } from "@/lib/utils/period";
import type { AllocationType, TransactionType } from "@/types";

export interface DashboardSummary {
  balance: number;
  income: number;
  expenses: number;
  netCashFlow: number;
  deltas: { balance: number; income: number; expenses: number; netCashFlow: number };
}

export interface RecentTransaction {
  id: string;
  group: string;
  category: string;
  type: TransactionType;
  amount: number;
}

export interface SpendingTrendPoint {
  date: string;
  amount: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  spendingByCategory: NamedAmount[];
  recentTransactions: RecentTransaction[];
  spendingTrend: SpendingTrendPoint[];
  trendBucket: "day" | "month";
  allocation: { savings: number; investment: number };
  hasAnyTransactions: boolean;
}

const EMPTY_DATA: DashboardData = {
  summary: {
    balance: 0,
    income: 0,
    expenses: 0,
    netCashFlow: 0,
    deltas: { balance: 0, income: 0, expenses: 0, netCashFlow: 0 },
  },
  spendingByCategory: [],
  recentTransactions: [],
  spendingTrend: [],
  trendBucket: "day",
  allocation: { savings: 0, investment: 0 },
  hasAnyTransactions: false,
};

function relativeDayLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function useDashboardData(period: DashboardPeriod) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const range = getPeriodRange(period);

      const [balanceRes, windowRes, recentRes, allocationRes] = await Promise.all([
        supabase.from("transactions").select("type, amount, transaction_date").order("transaction_date"),
        supabase
          .from("transactions")
          .select("category_id, category:categories(name), type, amount, transaction_date")
          .gte("transaction_date", toDateKey(range.previousStart))
          .lte("transaction_date", toDateKey(range.end)),
        supabase
          .from("transactions")
          .select("id, category:categories(name), type, amount, transaction_date")
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("allocations")
          .select("type, amount, allocation_date")
          .gte("allocation_date", toDateKey(range.start))
          .lte("allocation_date", toDateKey(range.end)),
      ]);

      if (!active) return;

      const firstError = balanceRes.error || windowRes.error || recentRes.error || allocationRes.error;
      if (firstError) {
        setError("We couldn't load your dashboard. Please try again.");
        setLoading(false);
        return;
      }

      const allTx = balanceRes.data ?? [];
      const balanceNow = allTx.reduce((sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0);
      const previousEndKey = toDateKey(range.previousEnd);
      const balanceAtPreviousEnd = allTx
        .filter((t) => t.transaction_date <= previousEndKey)
        .reduce((sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0);

      const windowTx = (windowRes.data ?? []) as {
        category_id: string;
        category: { name: string } | null;
        type: TransactionType;
        amount: number;
        transaction_date: string;
      }[];

      const startKey = toDateKey(range.start);
      const currentTx = windowTx.filter((t) => t.transaction_date >= startKey);
      const previousTx = windowTx.filter((t) => t.transaction_date < startKey);

      const sumByType = (rows: typeof currentTx, type: TransactionType) =>
        rows.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount, 0);

      const income = sumByType(currentTx, "INCOME");
      const expenses = sumByType(currentTx, "EXPENSE");
      const previousIncome = sumByType(previousTx, "INCOME");
      const previousExpenses = sumByType(previousTx, "EXPENSE");

      const categoryMap = new Map<string, number>();
      for (const t of currentTx) {
        if (t.type !== "EXPENSE") continue;
        const name = t.category?.name ?? "Other";
        categoryMap.set(name, (categoryMap.get(name) ?? 0) + t.amount);
      }
      const spendingByCategory = groupTopCategories(
        Array.from(categoryMap, ([name, amount]) => ({ name, amount })),
      );

      const trendMap = new Map<string, number>();
      for (const t of currentTx) {
        if (t.type !== "EXPENSE") continue;
        trendMap.set(t.transaction_date, (trendMap.get(t.transaction_date) ?? 0) + t.amount);
      }
      const spendingTrend: SpendingTrendPoint[] =
        range.bucket === "day"
          ? eachDayOfInterval({ start: range.start, end: range.end }).map((d) => {
              const key = toDateKey(d);
              return { date: key, amount: trendMap.get(key) ?? 0 };
            })
          : eachMonthOfInterval({ start: range.start, end: range.end }).map((monthStart) => {
              const amount = currentTx
                .filter((t) => t.type === "EXPENSE" && isSameMonth(new Date(`${t.transaction_date}T00:00:00`), monthStart))
                .reduce((sum, t) => sum + t.amount, 0);
              return { date: toDateKey(monthStart), amount };
            });

      const recentTransactions: RecentTransaction[] = (recentRes.data ?? []).map((t) => ({
        id: t.id,
        group: relativeDayLabel(t.transaction_date),
        category: t.category?.name ?? "Other",
        type: t.type,
        amount: t.amount,
      }));

      const allocationRows = (allocationRes.data ?? []) as { type: AllocationType; amount: number }[];
      const savings = allocationRows.filter((a) => a.type === "SAVING").reduce((s, a) => s + a.amount, 0);
      const investment = allocationRows.filter((a) => a.type === "INVESTMENT").reduce((s, a) => s + a.amount, 0);

      setData({
        summary: {
          balance: balanceNow,
          income,
          expenses,
          netCashFlow: income - expenses,
          deltas: {
            balance: percentChange(balanceNow, balanceAtPreviousEnd),
            income: percentChange(income, previousIncome),
            expenses: percentChange(expenses, previousExpenses),
            netCashFlow: percentChange(income - expenses, previousIncome - previousExpenses),
          },
        },
        spendingByCategory,
        recentTransactions,
        spendingTrend,
        trendBucket: range.bucket,
        allocation: { savings, investment },
        hasAnyTransactions: allTx.length > 0,
      });
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [user, period]);

  return { data, loading, error };
}
