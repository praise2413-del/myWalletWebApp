import { useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { Purchase } from "@/types";

export const PAGE_SIZE = 10;

export interface PurchaseFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  sortDir: "asc" | "desc";
  page: number;
}

interface PurchaseRow {
  id: string;
  business_id: string;
  supplier_id: string | null;
  supplier: { name: string } | null;
  bill_number: string;
  bill_date: string;
  due_date: string | null;
  notes: string;
  journal_entry_id: string | null;
  created_at: string;
  purchase_lines: {
    id: string;
    purchase_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    line_order: number;
    product: { id: string; name: string; sku: string } | null;
  }[];
  purchase_payments: {
    id: string;
    purchase_id: string;
    payment_date: string;
    amount: number;
    account_id: string;
    account: { name: string } | null;
    created_at: string;
  }[];
}

function toPurchase(row: PurchaseRow): Purchase {
  const lines = [...row.purchase_lines].sort((a, b) => a.line_order - b.line_order).map((l) => ({
    id: l.id,
    purchaseId: l.purchase_id,
    productId: l.product_id,
    product: l.product ?? { id: l.product_id, name: "Unknown product", sku: "" },
    quantity: l.quantity,
    unitPrice: l.unit_price,
    lineTotal: l.line_total,
    lineOrder: l.line_order,
  }));
  const payments = [...row.purchase_payments]
    .sort((a, b) => a.payment_date.localeCompare(b.payment_date))
    .map((p) => ({
      id: p.id,
      purchaseId: p.purchase_id,
      paymentDate: p.payment_date,
      amount: p.amount,
      accountId: p.account_id,
      accountName: p.account?.name ?? "Unknown account",
      createdAt: p.created_at,
    }));

  const total = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    id: row.id,
    businessId: row.business_id,
    supplierId: row.supplier_id,
    supplierName: row.supplier?.name ?? null,
    billNumber: row.bill_number,
    billDate: row.bill_date,
    dueDate: row.due_date,
    notes: row.notes,
    journalEntryId: row.journal_entry_id,
    createdAt: row.created_at,
    lines,
    payments,
    total,
    amountPaid,
  };
}

const SELECT =
  "*, supplier:suppliers(name), purchase_lines(*, product:products(id, name, sku)), purchase_payments(*, account:accounts(name))";

export function usePurchasesQuery(filters: PurchaseFilters, refreshKey: number) {
  const { activeBusiness } = useBusiness();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusiness) {
      setPurchases([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      let query = supabase.from("purchases").select(SELECT, { count: "exact" }).eq("business_id", activeBusiness!.id);
      if (filters.dateFrom) query = query.gte("bill_date", filters.dateFrom);
      if (filters.dateTo) query = query.lte("bill_date", filters.dateTo);
      if (filters.search.trim()) {
        const term = filters.search.trim();
        query = query.or(`bill_number.ilike.%${term}%,notes.ilike.%${term}%`);
      }

      const from = (filters.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: fetchError, count } = await query
        .order("bill_date", { ascending: filters.sortDir === "asc" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!active) return;
      if (fetchError) {
        setError("We couldn't load purchases. Please try again.");
        setLoading(false);
        return;
      }

      setPurchases((data ?? []).map((row) => toPurchase(row as unknown as PurchaseRow)));
      setTotal(count ?? 0);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [activeBusiness, filters.search, filters.dateFrom, filters.dateTo, filters.sortDir, filters.page, refreshKey]);

  return { purchases, total, loading, error };
}
