import { ArrowDown, ArrowUp, Eye, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import type { JournalEntryWithLines } from "@/types";

interface JournalEntriesTableProps {
  entries: JournalEntryWithLines[];
  currency: string;
  loading: boolean;
  sortDir: "asc" | "desc";
  onToggleSort: () => void;
  onView: (entry: JournalEntryWithLines) => void;
  onDelete: (entry: JournalEntryWithLines) => void;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function JournalEntriesTable({
  entries,
  currency,
  loading,
  sortDir,
  onToggleSort,
  onView,
  onDelete,
}: JournalEntriesTableProps) {
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
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Reference</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-background/60">
                <td className="whitespace-nowrap px-5 py-3 text-text-secondary">{formatDate(entry.entryDate)}</td>
                <td className="px-5 py-3">
                  <span className="font-medium text-text-primary">{entry.description}</span>
                  <span className="ml-2 text-xs text-text-tertiary">
                    {entry.lines.length} line{entry.lines.length === 1 ? "" : "s"}
                  </span>
                </td>
                <td className="px-5 py-3 text-text-tertiary">{entry.reference || "—"}</td>
                <td className="px-5 py-3 text-right font-semibold text-text-primary">
                  {formatCurrency(entry.total, currency)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onView(entry)}
                      aria-label={`View entry: ${entry.description}`}
                      className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary"
                    >
                      <Eye className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(entry)}
                      aria-label={`Delete entry: ${entry.description}`}
                      className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-expense-50 hover:text-expense-600"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-border sm:hidden">
        {entries.map((entry) => (
          <li key={entry.id} className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{entry.description}</p>
                <p className="text-xs text-text-tertiary">
                  {formatDate(entry.entryDate)} · {entry.lines.length} line{entry.lines.length === 1 ? "" : "s"}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-text-primary">{formatCurrency(entry.total, currency)}</p>
            </div>
            <div className="mt-2 flex items-center justify-end gap-2">
              <button type="button" onClick={() => onView(entry)} aria-label="View" className="text-text-tertiary">
                <Eye className="size-3.5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => onDelete(entry)} aria-label="Delete" className="text-text-tertiary">
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
