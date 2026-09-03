import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

export interface RecordsTableRow {
  id: string;
  date: string;
  label: string;
  note: string | null;
  amount: number;
  /** Overrides the row's default accent color, e.g. to distinguish Savings from Investment rows. */
  accentClassName?: string;
}

interface RecordsTableProps {
  rows: RecordsTableRow[];
  currency: string;
  labelHeader?: string;
  emptyLabel: string;
  defaultAccentClassName: string;
}

export function RecordsTable({ rows, currency, labelHeader = "Category", emptyLabel, defaultAccentClassName }: RecordsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong py-6 text-center text-sm text-text-tertiary">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-background text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="w-2 p-0" aria-hidden="true" />
            <th className="px-3 py-2.5">Date</th>
            <th className="px-3 py-2.5">{labelHeader}</th>
            <th className="px-3 py-2.5">Description</th>
            <th className="px-3 py-2.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className={cn(i !== rows.length - 1 && "border-b border-border")}>
              <td className={cn("w-2 p-0", row.accentClassName ?? defaultAccentClassName)} aria-hidden="true" />
              <td className="whitespace-nowrap px-3 py-2.5 text-text-secondary">
                {format(new Date(`${row.date}T00:00:00`), "MMM d, yyyy")}
              </td>
              <td className="px-3 py-2.5 text-text-primary">{row.label}</td>
              <td className="max-w-[240px] truncate px-3 py-2.5 text-text-secondary">{row.note ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums text-text-primary">
                {formatCurrency(row.amount, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
