import { ArrowDown, ArrowUp, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import type { Sale } from "@/types";

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusFor(sale: Sale): { label: string; tone: "income" | "warning" | "expense" } {
  if (sale.amountPaid >= sale.total - 0.01) return { label: "Paid", tone: "income" };
  if (sale.amountPaid > 0) return { label: "Partially Paid", tone: "warning" };
  return { label: "Unpaid", tone: "expense" };
}

interface SalesTableProps {
  sales: Sale[];
  currency: string;
  loading: boolean;
  sortDir: "asc" | "desc";
  onToggleSort: () => void;
  onView: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
}

export function SalesTable({ sales, currency, loading, sortDir, onToggleSort, onView, onDelete }: SalesTableProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-5 py-3" aria-sort={sortDir === "asc" ? "ascending" : "descending"}>
              <button type="button" onClick={onToggleSort} className="flex items-center gap-1 hover:text-text-secondary">
                Date
                {sortDir === "asc" ? <ArrowUp className="size-3" aria-hidden="true" /> : <ArrowDown className="size-3" aria-hidden="true" />}
              </button>
            </th>
            <th className="px-5 py-3">Invoice</th>
            <th className="px-5 py-3">Customer</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Total</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => {
            const status = statusFor(sale);
            return (
              <tr key={sale.id} className="border-b border-border last:border-0 hover:bg-background/60">
                <td className="whitespace-nowrap px-5 py-3 text-text-secondary">{formatDate(sale.invoiceDate)}</td>
                <td className="px-5 py-3 text-text-primary">{sale.invoiceNumber || "—"}</td>
                <td className="px-5 py-3 text-text-secondary">{sale.customerName ?? "Walk-in"}</td>
                <td className="px-5 py-3">
                  <Badge tone={status.tone}>{status.label}</Badge>
                </td>
                <td className="px-5 py-3 text-right font-semibold text-text-primary">{formatCurrency(sale.total, currency)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => onView(sale)} aria-label={`View invoice ${sale.invoiceNumber}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary">
                      <Eye className="size-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => onDelete(sale)} aria-label={`Delete invoice ${sale.invoiceNumber}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-expense-50 hover:text-expense-600">
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
