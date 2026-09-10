import { useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { AccountBalance } from "@/types";

/** All-time balance per account, from the `account_balances` view (Phase 2). */
export function useAccountBalances() {
  const { activeBusiness } = useBusiness();
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusiness) {
      setBalances([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("account_balances")
        .select("account_id, business_id, code, name, type, total_debit, total_credit, balance")
        .eq("business_id", activeBusiness!.id)
        .order("code");

      if (!active) return;

      if (fetchError) {
        setError("We couldn't load account balances.");
        setLoading(false);
        return;
      }

      setError(null);
      // account_balances is a grouped view (Postgres can't prove every
      // column is non-null from a group-by), so every field types as
      // nullable even though the underlying accounts row guarantees them —
      // the only genuinely-nullable case is the sum columns for an account
      // with zero journal lines, which coalesce(...) already zeroes in SQL.
      setBalances(
        (data ?? []).map((row) => ({
          accountId: row.account_id ?? "",
          businessId: row.business_id ?? "",
          code: row.code ?? "",
          name: row.name ?? "",
          type: row.type ?? "ASSET",
          totalDebit: row.total_debit ?? 0,
          totalCredit: row.total_credit ?? 0,
          balance: row.balance ?? 0,
        })),
      );
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [activeBusiness]);

  return { balances, loading, error };
}
