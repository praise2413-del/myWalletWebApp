import { useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { AccountType, JournalEntryWithLines } from "@/types";

export const PAGE_SIZE = 10;

export interface JournalEntryFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  sortDir: "asc" | "desc";
  page: number;
}

interface JournalEntryRow {
  id: string;
  business_id: string;
  entry_date: string;
  description: string;
  reference: string;
  created_by: string;
  created_at: string;
  journal_entry_lines: {
    id: string;
    journal_entry_id: string;
    business_id: string;
    account_id: string;
    debit: number;
    credit: number;
    line_order: number;
    created_at: string;
    account: { id: string; code: string; name: string; type: AccountType } | null;
  }[];
}

function toJournalEntry(row: JournalEntryRow): JournalEntryWithLines {
  const lines = [...row.journal_entry_lines]
    .sort((a, b) => a.line_order - b.line_order)
    .map((line) => ({
      id: line.id,
      journalEntryId: line.journal_entry_id,
      businessId: line.business_id,
      accountId: line.account_id,
      account: line.account ?? { id: line.account_id, code: "?", name: "Unknown account", type: "EXPENSE" as const },
      debit: line.debit,
      credit: line.credit,
      lineOrder: line.line_order,
      createdAt: line.created_at,
    }));

  return {
    id: row.id,
    businessId: row.business_id,
    entryDate: row.entry_date,
    description: row.description,
    reference: row.reference,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lines,
    total: lines.reduce((sum, line) => sum + line.debit, 0),
  };
}

export function useJournalEntriesQuery(filters: JournalEntryFilters, refreshKey: number) {
  const { activeBusiness } = useBusiness();
  const [entries, setEntries] = useState<JournalEntryWithLines[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusiness) {
      setEntries([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("journal_entries")
        .select("*, journal_entry_lines(*, account:accounts(id, code, name, type))", { count: "exact" })
        .eq("business_id", activeBusiness!.id);

      if (filters.dateFrom) query = query.gte("entry_date", filters.dateFrom);
      if (filters.dateTo) query = query.lte("entry_date", filters.dateTo);
      if (filters.search.trim()) {
        const term = filters.search.trim();
        query = query.or(`description.ilike.%${term}%,reference.ilike.%${term}%`);
      }

      const from = (filters.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: fetchError, count } = await query
        .order("entry_date", { ascending: filters.sortDir === "asc" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!active) return;

      if (fetchError) {
        setError("We couldn't load journal entries. Please try again.");
        setLoading(false);
        return;
      }

      setEntries((data ?? []).map((row) => toJournalEntry(row as unknown as JournalEntryRow)));
      setTotal(count ?? 0);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [activeBusiness, filters.search, filters.dateFrom, filters.dateTo, filters.sortDir, filters.page, refreshKey]);

  return { entries, total, loading, error };
}
