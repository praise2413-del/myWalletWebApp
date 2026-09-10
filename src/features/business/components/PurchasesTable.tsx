import { ArrowDown, ArrowUp, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import type { Purchase } from "@/types";

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusFor(purchase: Purchase): { label: string; tone: "income" | "warning" | "expense" } {
  if (purchase.amountPaid >= purchase.total - 0.01) return { label: "Paid", tone: "income" };
  if (purchase.amountPaid > 0) return { label: "Partially Paid", tone: "warning" };
  return { label: "Unpaid", tone: "expense" };
}

interface PurchasesTableProps {
  purchases: Purchase[];
  currency: string;
  loading: boolean;
  sortDir: "asc" | "desc";
  onToggleSort: () => void;
  onView: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
}

export function PurchasesTable({ purchases, currency, loading, sortDir, onToggleSort, onView, onDelete }: PurchasesTableProps) {
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
            <th className="px-5 py-3">Bill</th>
            <th className="px-5 py-3">Supplier</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Total</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => {
            const status = statusFor(purchase);
            return (
              <tr key={purchase.id} className="border-b border-border last:border-0 hover:bg-background/60">
                <td className="whitespace-nowrap px-5 py-3 text-text-secondary">{formatDate(purchase.billDate)}</td>
                <td className="px-5 py-3 text-text-primary">{purchase.billNumber || "—"}</td>
                <td className="px-5 py-3 text-text-secondary">{purchase.supplierName ?? "Cash purchase"}</td>
                <td className="px-5 py-3">
                  <Badge tone={status.tone}>{status.label}</Badge>
                </td>
                <td className="px-5 py-3 text-right font-semibold text-text-primary">{formatCurrency(purchase.total, currency)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => onView(purchase)} aria-label={`View bill ${purchase.billNumber}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary">
                      <Eye className="size-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => onDelete(purchase)} aria-label={`Delete bill ${purchase.billNumber}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-expense-50 hover:text-expense-600">
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
