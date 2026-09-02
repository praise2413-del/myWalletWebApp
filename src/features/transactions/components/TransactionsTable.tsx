import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { getCategoryColor, getCategoryIcon } from "@/lib/utils/categoryVisuals";
import { formatSignedCurrency } from "@/lib/utils/currency";
import type { Transaction } from "@/types";

interface TransactionsTableProps {
  transactions: Transaction[];
  currency: string;
  loading: boolean;
  sortDir: "asc" | "desc";
  onToggleSort: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TransactionsTable({
  transactions,
  currency,
  loading,
  sortDir,
  onToggleSort,
  onEdit,
  onDelete,
}: TransactionsTableProps) {
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
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-5 py-3" aria-sort={sortDir === "asc" ? "ascending" : "descending"}>
                <button type="button" onClick={onToggleSort} className="flex items-center gap-1 hover:text-text-secondary">
                  Date
                  {sortDir === "asc" ? (
                    <ArrowUp className="size-3" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="size-3" aria-hidden="true" />
                  )}
                </button>
              </th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Note</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const Icon = getCategoryIcon(t.category.icon);
              const color = getCategoryColor(t.category.name);
              return (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-background/60">
                  <td className="whitespace-nowrap px-5 py-3 text-text-secondary">{formatDate(t.transactionDate)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
                      >
                        <Icon className="size-3.5" style={{ color }} aria-hidden="true" />
                      </span>
                      <span className="font-medium text-text-primary">{t.category.name}</span>
                    </div>
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-text-tertiary">{t.note || "—"}</td>
                  <td className="px-5 py-3">
                    <Badge tone={t.type === "INCOME" ? "income" : "expense"}>
                      {t.type === "INCOME" ? "Income" : "Expense"}
                    </Badge>
                  </td>
                  <td
                    className={
                      t.type === "INCOME"
                        ? "px-5 py-3 text-right font-semibold text-income-600"
                        : "px-5 py-3 text-right font-semibold text-expense-600"
                    }
                  >
                    {formatSignedCurrency(t.amount, t.type, currency)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(t)}
                        aria-label={`Edit ${t.category.name} transaction`}
                        className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(t)}
                        aria-label={`Delete ${t.category.name} transaction`}
                        className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-expense-50 hover:text-expense-600"
                      >
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

      {/* Mobile cards */}
      <ul className="divide-y divide-border sm:hidden">
        {transactions.map((t) => {
          const Icon = getCategoryIcon(t.category.icon);
          const color = getCategoryColor(t.category.name);
          return (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3.5">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
              >
                <Icon className="size-4" style={{ color }} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{t.category.name}</p>
                <p className="text-xs text-text-tertiary">{formatDate(t.transactionDate)}</p>
              </div>
              <div className="text-right">
                <p
                  className={
                    t.type === "INCOME" ? "text-sm font-semibold text-income-600" : "text-sm font-semibold text-expense-600"
                  }
                >
                  {formatSignedCurrency(t.amount, t.type, currency)}
                </p>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => onEdit(t)} aria-label="Edit" className="text-text-tertiary">
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => onDelete(t)} aria-label="Delete" className="text-text-tertiary">
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
