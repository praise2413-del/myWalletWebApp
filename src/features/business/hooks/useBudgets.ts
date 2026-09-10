import { useCallback, useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { Budget } from "@/types";

interface BudgetRow {
  id: string;
  business_id: string;
  account_id: string;
  month: number;
  year: number;
  amount: number;
  account: { code: string; name: string } | null;
}

function toBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    businessId: row.business_id,
    accountId: row.account_id,
    accountCode: row.account?.code ?? "",
    accountName: row.account?.name ?? "Unknown account",
    month: row.month,
    year: row.year,
    amount: row.amount,
  };
}

export function useBudgets(month: number, year: number) {
  const { activeBusiness } = useBusiness();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeBusiness) {
      setBudgets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("budgets")
      .select("*, account:accounts(code, name)")
      .eq("business_id", activeBusiness.id)
      .eq("month", month)
      .eq("year", year);

    if (fetchError) {
      setError("We couldn't load budgets.");
      setLoading(false);
      return;
    }
    setError(null);
    setBudgets((data ?? []).map((row) => toBudget(row as unknown as BudgetRow)).sort((a, b) => a.accountCode.localeCompare(b.accountCode)));
    setLoading(false);
  }, [activeBusiness, month, year]);

  useEffect(() => {
    load();
  }, [load]);

  return { budgets, loading, error, refresh: load };
}
