import { differenceInCalendarDays } from "date-fns";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { groupTopCategories, type NamedAmount } from "@/lib/utils/aggregate";
import {
  type CustomDateRange,
  getReportPeriodRange,
  percentChange,
  type PeriodRange,
  toDateKey,
} from "@/lib/utils/period";
import type { AllocationType, ReportPeriod, TransactionType } from "@/types";

export interface CategoryChange {
  name: string;
  amount: number;
  previousAmount: number;
  changePercent: number;
}

export interface ReportSummary {
  income: number;
  expenses: number;
  netCashFlow: number;
  previousIncome: number;
  previousExpenses: number;
  previousNetCashFlow: number;
  deltas: { income: number; expenses: number; netCashFlow: number };
  averageDailyExpense: number;
  highestCategory: NamedAmount | null;
  highestSpendingDay: { date: string; amount: number } | null;
}

export interface ReportData {
  range: PeriodRange;
  summary: ReportSummary;
  categoryDistribution: NamedAmount[];
  categoryComparison: NamedAmount[];
  categoryBreakdown: NamedAmount[];
  categoryChanges: CategoryChange[];
  spendingTrend: { date: string; amount: number }[];
  trendBucket: "day" | "month";
  allocation: { savings: number; investment: number };
  hasAnyExpenses: boolean;
}

const EMPTY_DATA: ReportData = {
  range: { start: new Date(), end: new Date(), previousStart: new Date(), previousEnd: new Date(), bucket: "day" },
  summary: {
    income: 0,
    expenses: 0,
    netCashFlow: 0,
    previousIncome: 0,
    previousExpenses: 0,
    previousNetCashFlow: 0,
    deltas: { income: 0, expenses: 0, netCashFlow: 0 },
    averageDailyExpense: 0,
    highestCategory: null,
    highestSpendingDay: null,
  },
  categoryDistribution: [],
  categoryComparison: [],
  categoryBreakdown: [],
  categoryChanges: [],
  spendingTrend: [],
  trendBucket: "day",
  allocation: { savings: 0, investment: 0 },
  hasAnyExpenses: false,
};

interface TransactionRow {
  category_id: string;
  category: { name: string } | null;
  type: TransactionType;
  amount: number;
  transaction_date: string;
}

export function useReportsData(period: ReportPeriod, customRange?: CustomDateRange) {
  const { user } = useAuth();
  const [data, setData] = useState<ReportData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const customStartKey = customRange ? toDateKey(customRange.start) : null;
  const customEndKey = customRange ? toDateKey(customRange.end) : null;

  useEffect(() => {
    if (!user) return;
    if (period === "custom" && (!customStartKey || !customEndKey)) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const range = getReportPeriodRange(period, new Date(), customRange);

      const [windowRes, allocationRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("category_id, category:categories(name), type, amount, transaction_date")
          .gte("transaction_date", toDateKey(range.previousStart))
          .lte("transaction_date", toDateKey(range.end)),
        supabase
          .from("allocations")
          .select("type, amount")
          .gte("allocation_date", toDateKey(range.start))
          .lte("allocation_date", toDateKey(range.end)),
      ]);

      if (!active) return;

      if (windowRes.error || allocationRes.error) {
        setError("We couldn't load your report. Please try again.");
        setLoading(false);
        return;
      }

      const windowTx = (windowRes.data ?? []) as TransactionRow[];
      const startKey = toDateKey(range.start);
      const currentTx = windowTx.filter((t) => t.transaction_date >= startKey);
      const previousTx = windowTx.filter((t) => t.transaction_date < startKey);

      const sumByType = (rows: TransactionRow[], type: TransactionType) =>
        rows.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount, 0);

      const income = sumByType(currentTx, "INCOME");
      const expenses = sumByType(currentTx, "EXPENSE");
      const previousIncome = sumByType(previousTx, "INCOME");
      const previousExpenses = sumByType(previousTx, "EXPENSE");

      const categoryTotal = (rows: TransactionRow[]) => {
        const map = new Map<string, number>();
        for (const t of rows) {
          if (t.type !== "EXPENSE") continue;
          const name = t.category?.name ?? "Other";
          map.set(name, (map.get(name) ?? 0) + t.amount);
        }
        return map;
      };
      const currentCategoryMap = categoryTotal(currentTx);
      const previousCategoryMap = categoryTotal(previousTx);

      const categoryEntries = Array.from(currentCategoryMap, ([name, amount]) => ({ name, amount }));
      const categoryBreakdown = [...categoryEntries].sort((a, b) => b.amount - a.amount);
      const categoryDistribution = groupTopCategories(categoryEntries, 5);
      const categoryComparison = groupTopCategories(categoryEntries, 8);

      const categoryChanges: CategoryChange[] = Array.from(
        new Set([...currentCategoryMap.keys(), ...previousCategoryMap.keys()]),
      )
        .map((name) => {
          const amount = currentCategoryMap.get(name) ?? 0;
          const previousAmount = previousCategoryMap.get(name) ?? 0;
          return { name, amount, previousAmount, changePercent: percentChange(amount, previousAmount) };
        })
        .sort((a, b) => Math.abs(b.amount - b.previousAmount) - Math.abs(a.amount - a.previousAmount))
        .slice(0, 4);

      const dayTotals = new Map<string, number>();
      for (const t of currentTx) {
        if (t.type !== "EXPENSE") continue;
        dayTotals.set(t.transaction_date, (dayTotals.get(t.transaction_date) ?? 0) + t.amount);
      }

      let highestSpendingDay: { date: string; amount: number } | null = null;
      for (const [date, amount] of dayTotals) {
        if (!highestSpendingDay || amount > highestSpendingDay.amount) highestSpendingDay = { date, amount };
      }

      const spendingTrend =
        range.bucket === "day"
          ? Array.from(
              { length: differenceInCalendarDays(range.end, range.start) + 1 },
              (_, i) => {
                const d = new Date(range.start);
                d.setDate(d.getDate() + i);
                const key = toDateKey(d);
                return { date: key, amount: dayTotals.get(key) ?? 0 };
              },
            )
          : monthlyBuckets(range, currentTx);

      const numberOfDays = differenceInCalendarDays(range.end, range.start) + 1;

      const allocationRows = (allocationRes.data ?? []) as { type: AllocationType; amount: number }[];
      const savings = allocationRows.filter((a) => a.type === "SAVING").reduce((s, a) => s + a.amount, 0);
      const investment = allocationRows.filter((a) => a.type === "INVESTMENT").reduce((s, a) => s + a.amount, 0);

      setData({
        range,
        summary: {
          income,
          expenses,
          netCashFlow: income - expenses,
          previousIncome,
          previousExpenses,
          previousNetCashFlow: previousIncome - previousExpenses,
          deltas: {
            income: percentChange(income, previousIncome),
            expenses: percentChange(expenses, previousExpenses),
            netCashFlow: percentChange(income - expenses, previousIncome - previousExpenses),
          },
          averageDailyExpense: numberOfDays > 0 ? expenses / numberOfDays : 0,
          highestCategory: categoryBreakdown[0] ?? null,
          highestSpendingDay,
        },
        categoryDistribution,
        categoryComparison,
        categoryBreakdown,
        categoryChanges,
        spendingTrend,
        trendBucket: range.bucket,
        allocation: { savings, investment },
        hasAnyExpenses: expenses > 0,
      });
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [user, period, customStartKey, customEndKey, customRange]);

  return { data, loading, error };
}

function monthlyBuckets(range: PeriodRange, currentTx: TransactionRow[]): { date: string; amount: number }[] {
  const buckets = new Map<string, number>();
  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
  const end = range.end;
  while (cursor <= end) {
    buckets.set(toDateKey(cursor), 0);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  for (const t of currentTx) {
    if (t.type !== "EXPENSE") continue;
    const d = new Date(`${t.transaction_date}T00:00:00`);
    const key = toDateKey(new Date(d.getFullYear(), d.getMonth(), 1));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + t.amount);
  }
  return Array.from(buckets, ([date, amount]) => ({ date, amount }));
}
