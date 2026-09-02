import { ArrowDown, ArrowUp, Pencil, PiggyBank, Trash2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import type { Allocation } from "@/types";

interface AllocationsTableProps {
  allocations: Allocation[];
  currency: string;
  loading: boolean;
  sortDir: "asc" | "desc";
  onToggleSort: () => void;
  onEdit: (allocation: Allocation) => void;
  onDelete: (allocation: Allocation) => void;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AllocationsTable({
  allocations,
  currency,
  loading,
  sortDir,
  onToggleSort,
  onEdit,
  onDelete,
}: AllocationsTableProps) {
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
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Note</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((a) => {
              const Icon = a.type === "SAVING" ? PiggyBank : TrendingUp;
              return (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-background/60">
                  <td className="whitespace-nowrap px-5 py-3 text-text-secondary">{formatDate(a.allocationDate)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50">
                        <Icon className="size-3.5 text-primary-600 dark:text-primary-500" aria-hidden="true" />
                      </span>
                      <Badge tone="primary">{a.type === "SAVING" ? "Saving" : "Investment"}</Badge>
                    </div>
                  </td>
                  <td className="max-w-[240px] truncate px-5 py-3 text-text-tertiary">{a.note || "—"}</td>
                  <td className="px-5 py-3 text-right font-semibold text-primary-600 dark:text-primary-500">
                    {formatCurrency(a.amount, currency)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(a)}
                        aria-label="Edit allocation"
                        className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(a)}
                        aria-label="Delete allocation"
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

      <ul className="divide-y divide-border sm:hidden">
        {allocations.map((a) => {
          const Icon = a.type === "SAVING" ? PiggyBank : TrendingUp;
          return (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50">
                <Icon className="size-4 text-primary-600 dark:text-primary-500" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {a.type === "SAVING" ? "Saving" : "Investment"}
                </p>
                <p className="text-xs text-text-tertiary">{formatDate(a.allocationDate)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-500">
                  {formatCurrency(a.amount, currency)}
                </p>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => onEdit(a)} aria-label="Edit" className="text-text-tertiary">
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => onDelete(a)} aria-label="Delete" className="text-text-tertiary">
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
