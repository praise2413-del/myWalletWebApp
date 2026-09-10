import { useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { Sale } from "@/types";

export const PAGE_SIZE = 10;

export interface SaleFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  sortDir: "asc" | "desc";
  page: number;
}

interface SaleRow {
  id: string;
  business_id: string;
  customer_id: string | null;
  customer: { name: string } | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  notes: string;
  journal_entry_id: string | null;
  created_at: string;
  sale_lines: {
    id: string;
    sale_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    line_order: number;
    product: { id: string; name: string; sku: string } | null;
  }[];
  sale_payments: {
    id: string;
    sale_id: string;
    payment_date: string;
    amount: number;
    account_id: string;
    account: { name: string } | null;
    created_at: string;
  }[];
}

function toSale(row: SaleRow): Sale {
  const lines = [...row.sale_lines].sort((a, b) => a.line_order - b.line_order).map((l) => ({
    id: l.id,
    saleId: l.sale_id,
    productId: l.product_id,
    product: l.product ?? { id: l.product_id, name: "Unknown product", sku: "" },
    quantity: l.quantity,
    unitPrice: l.unit_price,
    lineTotal: l.line_total,
    lineOrder: l.line_order,
  }));
  const payments = [...row.sale_payments]
    .sort((a, b) => a.payment_date.localeCompare(b.payment_date))
    .map((p) => ({
      id: p.id,
      saleId: p.sale_id,
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
    customerId: row.customer_id,
    customerName: row.customer?.name ?? null,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
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
  "*, customer:customers(name), sale_lines(*, product:products(id, name, sku)), sale_payments(*, account:accounts(name))";

export function useSalesQuery(filters: SaleFilters, refreshKey: number) {
  const { activeBusiness } = useBusiness();
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusiness) {
      setSales([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      let query = supabase.from("sales").select(SELECT, { count: "exact" }).eq("business_id", activeBusiness!.id);
      if (filters.dateFrom) query = query.gte("invoice_date", filters.dateFrom);
      if (filters.dateTo) query = query.lte("invoice_date", filters.dateTo);
      if (filters.search.trim()) {
        const term = filters.search.trim();
        query = query.or(`invoice_number.ilike.%${term}%,notes.ilike.%${term}%`);
      }

      const from = (filters.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: fetchError, count } = await query
        .order("invoice_date", { ascending: filters.sortDir === "asc" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!active) return;
      if (fetchError) {
        setError("We couldn't load sales. Please try again.");
        setLoading(false);
        return;
      }

      setSales((data ?? []).map((row) => toSale(row as unknown as SaleRow)));
      setTotal(count ?? 0);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [activeBusiness, filters.search, filters.dateFrom, filters.dateTo, filters.sortDir, filters.page, refreshKey]);

  return { sales, total, loading, error };
}

export async function fetchSaleById(saleId: string): Promise<Sale | null> {
  const { data, error } = await supabase.from("sales").select(SELECT).eq("id", saleId).single();
  if (error || !data) return null;
  return toSale(data as unknown as SaleRow);
}
