import { useEffect, useState } from "react";
import { CASH_ACCOUNT_CODES } from "@/features/business/lib/statements";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import { getPeriodRange, percentChange, toDateKey } from "@/lib/utils/period";
import type { AccountType } from "@/types";

export interface BusinessDashboardSummary {
  revenue: number;
  expenses: number;
  netProfit: number;
  cashPosition: number;
  deltas: { revenue: number; expenses: number; netProfit: number; cashPosition: number };
}

const EMPTY_SUMMARY: BusinessDashboardSummary = {
  revenue: 0,
  expenses: 0,
  netProfit: 0,
  cashPosition: 0,
  deltas: { revenue: 0, expenses: 0, netProfit: 0, cashPosition: 0 },
};

interface LineRow {
  debit: number;
  credit: number;
  account: { code: string; type: AccountType } | null;
  journal_entry: { entry_date: string } | null;
}

export function useBusinessDashboardData() {
  const { activeBusiness } = useBusiness();
  const [summary, setSummary] = useState<BusinessDashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusiness) {
      setSummary(EMPTY_SUMMARY);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const range = getPeriodRange("This Month");

      const { data, error: fetchError } = await supabase
        .from("journal_entry_lines")
        .select("debit, credit, account:accounts(code, type), journal_entry:journal_entries!inner(entry_date)")
        .eq("business_id", activeBusiness!.id);

      if (!active) return;

      if (fetchError) {
        setError("We couldn't load your business dashboard. Please try again.");
        setLoading(false);
        return;
      }

      const lines = (data ?? []) as unknown as LineRow[];
      const startKey = toDateKey(range.start);
      const endKey = toDateKey(range.end);
      const previousStartKey = toDateKey(range.previousStart);
      const previousEndKey = toDateKey(range.previousEnd);

      const sumByType = (type: AccountType, from: string, to: string) =>
        lines
          .filter(
            (l) =>
              l.account?.type === type &&
              l.journal_entry &&
              l.journal_entry.entry_date >= from &&
              l.journal_entry.entry_date <= to,
          )
          .reduce((sum, l) => sum + (type === "REVENUE" ? l.credit - l.debit : l.debit - l.credit), 0);

      const revenue = sumByType("REVENUE", startKey, endKey);
      const expenses = sumByType("EXPENSE", startKey, endKey);
      const previousRevenue = sumByType("REVENUE", previousStartKey, previousEndKey);
      const previousExpenses = sumByType("EXPENSE", previousStartKey, previousEndKey);

      const cashBalanceAsOf = (asOfKey: string) =>
        lines
          .filter((l) => l.account && CASH_ACCOUNT_CODES.includes(l.account.code) && l.journal_entry && l.journal_entry.entry_date <= asOfKey)
          .reduce((sum, l) => sum + (l.debit - l.credit), 0);

      const cashPosition = cashBalanceAsOf(endKey);
      const previousCashPosition = cashBalanceAsOf(previousEndKey);

      setSummary({
        revenue,
        expenses,
        netProfit: revenue - expenses,
        cashPosition,
        deltas: {
          revenue: percentChange(revenue, previousRevenue),
          expenses: percentChange(expenses, previousExpenses),
          netProfit: percentChange(revenue - expenses, previousRevenue - previousExpenses),
          cashPosition: percentChange(cashPosition, previousCashPosition),
        },
      });
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [activeBusiness]);

  return { summary, loading, error };
}
