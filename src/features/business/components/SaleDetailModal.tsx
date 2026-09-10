import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils/currency";
import type { Sale } from "@/types";

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function statusFor(sale: Sale): { label: string; tone: "income" | "warning" | "expense" } {
  if (sale.amountPaid >= sale.total - 0.01) return { label: "Paid", tone: "income" };
  if (sale.amountPaid > 0) return { label: "Partially Paid", tone: "warning" };
  return { label: "Unpaid", tone: "expense" };
}

export function SaleDetailModal({
  sale,
  currency,
  onClose,
  onRecordPayment,
}: {
  sale: Sale | null;
  currency: string;
  onClose: () => void;
  onRecordPayment: () => void;
}) {
  const status = sale ? statusFor(sale) : null;
  const remaining = sale ? sale.total - sale.amountPaid : 0;

  return (
    <Modal
      open={Boolean(sale)}
      onClose={onClose}
      title={sale?.invoiceNumber ? `Invoice ${sale.invoiceNumber}` : "Sale Invoice"}
      description={sale ? `${sale.customerName ?? "Walk-in customer"} · ${formatDate(sale.invoiceDate)}` : undefined}
      size="md"
    >
      {sale && status && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge tone={status.tone}>{status.label}</Badge>
            {remaining > 0.005 && (
              <Button size="sm" onClick={onRecordPayment}>
                <Plus className="size-3.5" aria-hidden="true" />
                Record Payment
              </Button>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.lines.map((line) => (
                  <tr key={line.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-text-primary">{line.product.name}</td>
                    <td className="px-3 py-2 text-right text-text-primary">{line.quantity}</td>
                    <td className="px-3 py-2 text-right text-text-primary">{formatCurrency(line.unitPrice, currency)}</td>
                    <td className="px-3 py-2 text-right text-text-primary">{formatCurrency(line.lineTotal, currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-background font-semibold text-text-primary">
                  <td className="px-3 py-2" colSpan={3}>Total</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(sale.total, currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {sale.payments.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-tertiary">Payments</p>
              <div className="space-y-1.5">
                {sale.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm">
                    <span className="text-text-secondary">{formatDate(p.paymentDate)} · {p.accountName}</span>
                    <span className="font-medium text-income-600">{formatCurrency(p.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sale.notes && <p className="text-sm text-text-secondary">{sale.notes}</p>}
        </div>
      )}
    </Modal>
  );
}
