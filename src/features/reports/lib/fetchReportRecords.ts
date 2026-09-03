import { supabase } from "@/lib/supabase/client";
import { toDateKey, type PeriodRange } from "@/lib/utils/period";
import type { AllocationType, TransactionType } from "@/types";

export interface ReportRecord {
  id: string;
  /** 'yyyy-MM-dd' */
  date: string;
  label: string;
  icon?: string;
  note: string | null;
  amount: number;
}

export interface ReportRecords {
  incomeRecords: ReportRecord[];
  expenseRecords: ReportRecord[];
  allocationRecords: (ReportRecord & { allocationType: AllocationType })[];
}

interface TransactionRow {
  id: string;
  transaction_date: string;
  type: TransactionType;
  amount: number;
  note: string | null;
  category: { name: string; icon: string } | null;
}

interface AllocationRow {
  id: string;
  allocation_date: string;
  type: AllocationType;
  amount: number;
  note: string | null;
}

/**
 * Row-level detail for the report's Detailed Records tables (§10) — the one
 * query `useReportsData` doesn't already cover, since that hook only returns
 * aggregates. Scoped to exactly the selected period, not the extended
 * comparison window `useReportsData` fetches for its previous-period deltas.
 */
export async function fetchReportRecords(range: PeriodRange): Promise<{ data?: ReportRecords; error?: string }> {
  const startKey = toDateKey(range.start);
  const endKey = toDateKey(range.end);

  const [txRes, allocRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, transaction_date, type, amount, note, category:categories(name, icon)")
      .gte("transaction_date", startKey)
      .lte("transaction_date", endKey)
      .order("transaction_date"),
    supabase
      .from("allocations")
      .select("id, allocation_date, type, amount, note")
      .gte("allocation_date", startKey)
      .lte("allocation_date", endKey)
      .order("allocation_date"),
  ]);

  if (txRes.error || allocRes.error) {
    return { error: "We couldn't load the report's detailed records. Please try again." };
  }

  const txRows = (txRes.data ?? []) as TransactionRow[];
  const allocRows = (allocRes.data ?? []) as AllocationRow[];

  const incomeRecords: ReportRecord[] = txRows
    .filter((t) => t.type === "INCOME")
    .map((t) => ({
      id: t.id,
      date: t.transaction_date,
      label: t.category?.name ?? "Other",
      icon: t.category?.icon,
      note: t.note,
      amount: t.amount,
    }));

  const expenseRecords: ReportRecord[] = txRows
    .filter((t) => t.type === "EXPENSE")
    .map((t) => ({
      id: t.id,
      date: t.transaction_date,
      label: t.category?.name ?? "Other",
      icon: t.category?.icon,
      note: t.note,
      amount: t.amount,
    }));

  const allocationRecords = allocRows.map((a) => ({
    id: a.id,
    date: a.allocation_date,
    label: a.type === "SAVING" ? "Savings" : "Investment",
    note: a.note,
    amount: a.amount,
    allocationType: a.type,
  }));

  return { data: { incomeRecords, expenseRecords, allocationRecords } };
}
