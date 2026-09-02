import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import type { Allocation, AllocationType } from "@/types";

export const PAGE_SIZE = 10;

export interface AllocationFilters {
  type: AllocationType | "ALL";
  search: string;
  dateFrom: string;
  dateTo: string;
  sortDir: "asc" | "desc";
  page: number;
}

interface AllocationRow {
  id: string;
  user_id: string;
  type: AllocationType;
  amount: number;
  allocation_date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function toAllocation(row: AllocationRow): Allocation {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: row.amount,
    allocationDate: row.allocation_date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useAllocationsQuery(filters: AllocationFilters, refreshKey: number) {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      let query = supabase.from("allocations").select("*", { count: "exact" });

      if (filters.type !== "ALL") query = query.eq("type", filters.type);
      if (filters.dateFrom) query = query.gte("allocation_date", filters.dateFrom);
      if (filters.dateTo) query = query.lte("allocation_date", filters.dateTo);
      if (filters.search.trim()) query = query.ilike("note", `%${filters.search.trim()}%`);

      const from = (filters.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: fetchError, count } = await query
        .order("allocation_date", { ascending: filters.sortDir === "asc" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!active) return;

      if (fetchError) {
        setError("We couldn't load your savings & investment records. Please try again.");
        setLoading(false);
        return;
      }

      setAllocations((data ?? []).map(toAllocation));
      setTotal(count ?? 0);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [user, filters.type, filters.search, filters.dateFrom, filters.dateTo, filters.sortDir, filters.page, refreshKey]);

  return { allocations, total, loading, error };
}
