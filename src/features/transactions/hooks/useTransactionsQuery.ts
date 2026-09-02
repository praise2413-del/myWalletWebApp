import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import type { Transaction, TransactionType } from "@/types";

export const PAGE_SIZE = 10;

export interface TransactionFilters {
  type: TransactionType | "ALL";
  search: string;
  dateFrom: string;
  dateTo: string;
  sortDir: "asc" | "desc";
  page: number;
}

interface TransactionRow {
  id: string;
  user_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  category: { id: string; name: string; icon: string; type: TransactionType } | null;
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    category: row.category ?? { id: row.category_id, name: "Unknown", icon: "wallet", type: row.type },
    type: row.type,
    amount: row.amount,
    transactionDate: row.transaction_date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useTransactionsQuery(filters: TransactionFilters, refreshKey: number) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      let matchingCategoryIds: string[] | null = null;
      if (filters.search.trim()) {
        const { data: matches } = await supabase
          .from("categories")
          .select("id")
          .ilike("name", `%${filters.search.trim()}%`);
        matchingCategoryIds = (matches ?? []).map((m) => m.id);
      }

      let query = supabase
        .from("transactions")
        .select("*, category:categories(id, name, icon, type)", { count: "exact" });

      if (filters.type !== "ALL") query = query.eq("type", filters.type);
      if (filters.dateFrom) query = query.gte("transaction_date", filters.dateFrom);
      if (filters.dateTo) query = query.lte("transaction_date", filters.dateTo);

      if (filters.search.trim()) {
        const noteFilter = `note.ilike.%${filters.search.trim()}%`;
        const categoryFilter =
          matchingCategoryIds && matchingCategoryIds.length > 0
            ? `,category_id.in.(${matchingCategoryIds.join(",")})`
            : "";
        query = query.or(`${noteFilter}${categoryFilter}`);
      }

      const from = (filters.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: fetchError, count } = await query
        .order("transaction_date", { ascending: filters.sortDir === "asc" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!active) return;

      if (fetchError) {
        setError("We couldn't load your transactions. Please try again.");
        setLoading(false);
        return;
      }

      setTransactions((data ?? []).map((row) => toTransaction(row as unknown as TransactionRow)));
      setTotal(count ?? 0);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [
    user,
    filters.type,
    filters.search,
    filters.dateFrom,
    filters.dateTo,
    filters.sortDir,
    filters.page,
    refreshKey,
  ]);

  return { transactions, total, loading, error };
}
