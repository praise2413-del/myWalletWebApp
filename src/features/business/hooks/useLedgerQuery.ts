import { useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { AccountType } from "@/types";

export interface LedgerRow {
  lineId: string;
  entryId: string;
  entryDate: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  /** Running balance after this line, signed in the account's normal-balance direction. */
  runningBalance: number;
}

interface LedgerLineRow {
  id: string;
  debit: number;
  credit: number;
  journal_entry: { id: string; entry_date: string; description: string; reference: string } | null;
}

export function useLedgerQuery(accountId: string | null, accountType: AccountType | null, dateFrom: string, dateTo: string) {
  const { activeBusiness } = useBusiness();
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusiness || !accountId || !accountType) {
      setRows([]);
      setOpeningBalance(0);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const debitIsNormal = accountType === "ASSET" || accountType === "EXPENSE";

      let lineQuery = supabase
        .from("journal_entry_lines")
        .select("id, debit, credit, journal_entry:journal_entries!inner(id, entry_date, description, reference)")
        .eq("account_id", accountId!);
      if (dateFrom) lineQuery = lineQuery.gte("journal_entry.entry_date", dateFrom);
      if (dateTo) lineQuery = lineQuery.lte("journal_entry.entry_date", dateTo);

      const openingQuery = supabase
        .from("journal_entry_lines")
        .select("debit, credit, journal_entry:journal_entries!inner(entry_date)")
        .eq("account_id", accountId!)
        .lt("journal_entry.entry_date", dateFrom);

      const [openingRes, linesRes] = await Promise.all([
        dateFrom ? openingQuery : Promise.resolve({ data: [], error: null }),
        lineQuery
          .order("entry_date", { referencedTable: "journal_entry", ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      if (!active) return;

      if (openingRes.error || linesRes.error) {
        setError("We couldn't load the ledger for this account. Please try again.");
        setLoading(false);
        return;
      }

      const opening = ((openingRes.data ?? []) as { debit: number; credit: number }[]).reduce(
        (sum, l) => sum + (debitIsNormal ? l.debit - l.credit : l.credit - l.debit),
        0,
      );

      let running = opening;
      const built: LedgerRow[] = ((linesRes.data ?? []) as unknown as LedgerLineRow[])
        .filter((l) => l.journal_entry)
        .map((l) => {
          running += debitIsNormal ? l.debit - l.credit : l.credit - l.debit;
          return {
            lineId: l.id,
            entryId: l.journal_entry!.id,
            entryDate: l.journal_entry!.entry_date,
            description: l.journal_entry!.description,
            reference: l.journal_entry!.reference,
            debit: l.debit,
            credit: l.credit,
            runningBalance: running,
          };
        });

      setOpeningBalance(opening);
      setRows(built);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [activeBusiness, accountId, accountType, dateFrom, dateTo]);

  return { rows, openingBalance, loading, error };
}
