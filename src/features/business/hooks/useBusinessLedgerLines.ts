import { useEffect, useState } from "react";
import type { RawLedgerLine } from "@/features/business/lib/statements";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { AccountType } from "@/types";

interface LineRow {
  debit: number;
  credit: number;
  account: { id: string; code: string; name: string; type: AccountType; subtype: string } | null;
  journal_entry: { id: string; entry_date: string } | null;
}

/**
 * Every posted journal line for the active business, with its account and
 * entry metadata attached — the single dataset every financial statement
 * (Trial Balance, Income Statement, Balance Sheet, Cash Flow) is derived
 * from client-side via the pure functions in `lib/statements.ts`. One
 * fetch per business rather than a separate query per statement.
 */
export function useBusinessLedgerLines() {
  const { activeBusiness } = useBusiness();
  const [lines, setLines] = useState<RawLedgerLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusiness) {
      setLines([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("journal_entry_lines")
        .select("debit, credit, account:accounts(id, code, name, type, subtype), journal_entry:journal_entries!inner(id, entry_date)")
        .eq("business_id", activeBusiness!.id);

      if (!active) return;

      if (fetchError) {
        setError("We couldn't load the data for this statement. Please try again.");
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as unknown as LineRow[];
      setLines(
        rows
          .filter((r) => r.account && r.journal_entry)
          .map((r) => ({
            entryId: r.journal_entry!.id,
            entryDate: r.journal_entry!.entry_date,
            accountId: r.account!.id,
            accountCode: r.account!.code,
            accountName: r.account!.name,
            accountType: r.account!.type,
            accountSubtype: r.account!.subtype,
            debit: r.debit,
            credit: r.credit,
          })),
      );
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [activeBusiness]);

  return { lines, loading, error };
}
