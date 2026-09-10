import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils/currency";
import type { JournalEntryWithLines } from "@/types";

interface JournalEntryDetailModalProps {
  entry: JournalEntryWithLines | null;
  currency: string;
  onClose: () => void;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function JournalEntryDetailModal({ entry, currency, onClose }: JournalEntryDetailModalProps) {
  return (
    <Modal
      open={Boolean(entry)}
      onClose={onClose}
      title="Journal Entry"
      description={entry ? formatDate(entry.entryDate) : undefined}
      size="md"
    >
      {entry && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-text-primary">{entry.description}</p>
            {entry.reference && <p className="text-xs text-text-tertiary">Ref: {entry.reference}</p>}
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2 text-right">Debit</th>
                  <th className="px-3 py-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {entry.lines.map((line) => (
                  <tr key={line.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-text-primary">
                      <span className="font-mono text-xs text-text-tertiary">{line.account.code}</span>{" "}
                      {line.account.name}
                    </td>
                    <td className="px-3 py-2 text-right text-text-primary">
                      {line.debit > 0 ? formatCurrency(line.debit, currency) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-text-primary">
                      {line.credit > 0 ? formatCurrency(line.credit, currency) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-background font-semibold text-text-primary">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(entry.total, currency)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(entry.total, currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
