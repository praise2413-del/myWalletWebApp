import { eachMonthOfInterval, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  averageRateInsight,
  consecutiveIncreaseInsight as allocationConsecutiveIncreaseInsight,
  targetHitCountInsight,
  type AllocationHistoryPoint,
} from "@/lib/insights/allocationHistory";
import { getAllocationInsight, type AllocationInsightResult } from "@/lib/insights/allocation";
import {
  categoryStreakInsight,
  consecutiveSpendingIncreaseInsight,
  earlyMonthSpendingInsight,
  weekendVsWeekdayInsight,
  type MonthlySpendingSnapshot,
} from "@/lib/insights/behavioral";
import { generateComparativeInsights } from "@/lib/insights/comparative";
import { generateDescriptiveInsights } from "@/lib/insights/descriptive";
import { supabase } from "@/lib/supabase/client";
import { toDateKey } from "@/lib/utils/period";
import type { AllocationType, Insight, TransactionType } from "@/types";

const HISTORY_MONTHS = 6;

export interface InsightsData {
  descriptive: Insight[];
  comparative: Insight[];
  behavioral: Insight[];
  allocationResult: AllocationInsightResult | null;
  allocationBehavioral: Insight[];
  hasAnyExpenses: boolean;
  hasAnyIncome: boolean;
  monthsOfHistory: number;
}

const EMPTY_DATA: InsightsData = {
  descriptive: [],
  comparative: [],
  behavioral: [],
  allocationResult: null,
  allocationBehavioral: [],
  hasAnyExpenses: false,
  hasAnyIncome: false,
  monthsOfHistory: 0,
};

interface TransactionRow {
  category: { name: string } | null;
  type: TransactionType;
  amount: number;
  transaction_date: string;
}

export function useInsightsData() {
  const { user, profile } = useAuth();
  const currency = profile?.currency ?? "TZS";
  const target = profile?.allocationTarget ?? 30;

  const [data, setData] = useState<InsightsData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const now = new Date();
      const rangeStart = startOfMonth(subMonths(now, HISTORY_MONTHS - 1));
      const rangeEnd = endOfMonth(now);
      const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd });

      const [txRes, allocRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("category:categories(name), type, amount, transaction_date")
          .gte("transaction_date", toDateKey(rangeStart))
          .lte("transaction_date", toDateKey(rangeEnd)),
        supabase
          .from("allocations")
          .select("type, amount, allocation_date")
          .gte("allocation_date", toDateKey(rangeStart))
          .lte("allocation_date", toDateKey(rangeEnd)),
      ]);

      if (!active) return;

      if (txRes.error || allocRes.error) {
        setError("We couldn't load your insights. Please try again.");
        setLoading(false);
        return;
      }

      const transactions = (txRes.data ?? []) as TransactionRow[];
      const allocations = (allocRes.data ?? []) as { type: AllocationType; amount: number; allocation_date: string }[];

      // --- bucket everything by calendar month ---
      const monthlySnapshots: MonthlySpendingSnapshot[] = [];
      const allocationHistory: AllocationHistoryPoint[] = [];
      let currentMonthIncome = 0;
      let currentMonthExpenses = 0;
      let currentMonthTopCategory: { name: string; amount: number } | null = null;
      let previousMonthIncome = 0;
      let previousMonthExpenses = 0;
      const currentCategoryTotals = new Map<string, number>();
      const previousCategoryTotals = new Map<string, number>();
      let currentSavings = 0;
      let currentInvestment = 0;

      for (let i = 0; i < months.length; i++) {
        const monthStart = months[i];
        const monthEnd = endOfMonth(monthStart);
        const monthKey = format(monthStart, "yyyy-MM");
        const startKey = toDateKey(monthStart);
        const endKey = toDateKey(monthEnd);
        const isCurrent = i === months.length - 1;
        const isPrevious = i === months.length - 2;

        const monthTx = transactions.filter((t) => t.transaction_date >= startKey && t.transaction_date <= endKey);

        let income = 0;
        let expenses = 0;
        const categoryTotals = new Map<string, number>();
        const dayTotals = new Map<number, number>();

        for (const t of monthTx) {
          if (t.type === "INCOME") {
            income += t.amount;
          } else {
            expenses += t.amount;
            const name = t.category?.name ?? "Other";
            categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + t.amount);
            const day = Number(t.transaction_date.slice(8, 10));
            dayTotals.set(day, (dayTotals.get(day) ?? 0) + t.amount);
          }
        }

        let topCategory: string | null = null;
        let topAmount = 0;
        for (const [name, amount] of categoryTotals) {
          if (amount > topAmount) {
            topAmount = amount;
            topCategory = name;
          }
        }

        let highestSpendingDayOfMonth: number | null = null;
        let highestDayAmount = 0;
        for (const [day, amount] of dayTotals) {
          if (amount > highestDayAmount) {
            highestDayAmount = amount;
            highestSpendingDayOfMonth = day;
          }
        }

        monthlySnapshots.push({ monthKey, totalExpenses: expenses, topCategory, highestSpendingDayOfMonth });

        const monthAlloc = allocations.filter((a) => a.allocation_date >= startKey && a.allocation_date <= endKey);
        const savings = monthAlloc.filter((a) => a.type === "SAVING").reduce((s, a) => s + a.amount, 0);
        const investment = monthAlloc.filter((a) => a.type === "INVESTMENT").reduce((s, a) => s + a.amount, 0);
        allocationHistory.push({
          label: format(monthStart, "MMMM yyyy"),
          rate: income > 0 ? ((savings + investment) / income) * 100 : 0,
        });

        if (isCurrent) {
          currentMonthIncome = income;
          currentMonthExpenses = expenses;
          currentMonthTopCategory = topCategory ? { name: topCategory, amount: topAmount } : null;
          for (const [name, amount] of categoryTotals) currentCategoryTotals.set(name, amount);
          currentSavings = savings;
          currentInvestment = investment;
        }
        if (isPrevious) {
          previousMonthIncome = income;
          previousMonthExpenses = expenses;
          for (const [name, amount] of categoryTotals) previousCategoryTotals.set(name, amount);
        }
      }

      const categoryChanges = Array.from(
        new Set([...currentCategoryTotals.keys(), ...previousCategoryTotals.keys()]),
      ).map((name) => ({
        name,
        amount: currentCategoryTotals.get(name) ?? 0,
        previousAmount: previousCategoryTotals.get(name) ?? 0,
      }));

      const descriptive = generateDescriptiveInsights({
        income: currentMonthIncome,
        expenses: currentMonthExpenses,
        netCashFlow: currentMonthIncome - currentMonthExpenses,
        topCategory: currentMonthTopCategory,
        currency,
        periodLabel: "this month",
      });

      const comparative = generateComparativeInsights({
        income: currentMonthIncome,
        previousIncome: previousMonthIncome,
        expenses: currentMonthExpenses,
        previousExpenses: previousMonthExpenses,
        categoryChanges,
        currency,
      });

      const dailyExpenses = transactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((map, t) => {
          map.set(t.transaction_date, (map.get(t.transaction_date) ?? 0) + t.amount);
          return map;
        }, new Map<string, number>());

      const behavioral = [
        categoryStreakInsight(monthlySnapshots),
        consecutiveSpendingIncreaseInsight(monthlySnapshots),
        weekendVsWeekdayInsight(
          Array.from(dailyExpenses, ([date, amount]) => ({ date, amount })),
          rangeStart,
          rangeEnd,
          currency,
        ),
        earlyMonthSpendingInsight(monthlySnapshots),
      ].filter((insight): insight is Insight => insight !== null);

      const allocationResult = getAllocationInsight({
        income: currentMonthIncome,
        savings: currentSavings,
        investment: currentInvestment,
        target,
        currency,
      });

      const allocationBehavioral = [
        allocationConsecutiveIncreaseInsight(allocationHistory),
        averageRateInsight(allocationHistory),
        targetHitCountInsight(allocationHistory, target),
      ].filter((insight): insight is Insight => insight !== null);

      setData({
        descriptive,
        comparative,
        behavioral,
        allocationResult,
        allocationBehavioral,
        hasAnyExpenses: transactions.some((t) => t.type === "EXPENSE"),
        hasAnyIncome: transactions.some((t) => t.type === "INCOME"),
        monthsOfHistory: months.length,
      });
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [user, currency, target]);

  return { data, loading, error };
}
