import { useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";

export interface UpcomingPayment {
  id: string;
  kind: "RECEIVABLE" | "PAYABLE";
  dueDate: string;
  counterpartyName: string;
  reference: string;
  remaining: number;
}

/** Every unpaid/partially-paid sale or purchase that has a due date — no new schema, just a due-date view over Phase 4's existing tables. */
export function useUpcomingPayments() {
  const { activeBusiness } = useBusiness();
  const [payments, setPayments] = useState<UpcomingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusiness) {
      setPayments([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const [salesRes, purchasesRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id, due_date, invoice_number, customer:customers(name), sale_lines(quantity, unit_price, line_total), sale_payments(amount)")
          .eq("business_id", activeBusiness!.id)
          .not("due_date", "is", null),
        supabase
          .from("purchases")
          .select("id, due_date, bill_number, supplier:suppliers(name), purchase_lines(quantity, unit_price, line_total), purchase_payments(amount)")
          .eq("business_id", activeBusiness!.id)
          .not("due_date", "is", null),
      ]);

      if (!active) return;

      if (salesRes.error || purchasesRes.error) {
        setError("We couldn't load upcoming payments.");
        setLoading(false);
        return;
      }

      const receivables: UpcomingPayment[] = (salesRes.data ?? [])
        .map((s) => {
          const total = (s.sale_lines ?? []).reduce((sum, l) => sum + l.line_total, 0);
          const paid = (s.sale_payments ?? []).reduce((sum, p) => sum + p.amount, 0);
          return {
            id: s.id,
            kind: "RECEIVABLE" as const,
            dueDate: s.due_date as string,
            counterpartyName: (s.customer as { name: string } | null)?.name ?? "Walk-in",
            reference: s.invoice_number,
            remaining: total - paid,
          };
        })
        .filter((p) => p.remaining > 0.005);

      const payables: UpcomingPayment[] = (purchasesRes.data ?? [])
        .map((p) => {
          const total = (p.purchase_lines ?? []).reduce((sum, l) => sum + l.line_total, 0);
          const paid = (p.purchase_payments ?? []).reduce((sum, pay) => sum + pay.amount, 0);
          return {
            id: p.id,
            kind: "PAYABLE" as const,
            dueDate: p.due_date as string,
            counterpartyName: (p.supplier as { name: string } | null)?.name ?? "Cash purchase",
            reference: p.bill_number,
            remaining: total - paid,
          };
        })
        .filter((p) => p.remaining > 0.005);

      setPayments([...receivables, ...payables].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [activeBusiness]);

  return { payments, loading, error };
}
