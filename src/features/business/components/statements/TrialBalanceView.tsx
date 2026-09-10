import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import type { TrialBalance } from "@/features/business/lib/statements";
import { formatCurrency } from "@/lib/utils/currency";

export function TrialBalanceView({ trialBalance, currency }: { trialBalance: TrialBalance; currency: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="text-sm font-medium text-text-primary">Trial Balance</p>
        <Badge tone={Math.abs(trialBalance.totalDebit - trialBalance.totalCredit) < 0.01 ? "income" : "expense"}>
          {Math.abs(trialBalance.totalDebit - trialBalance.totalCredit) < 0.01 ? "Balanced" : "Out of balance"}
        </Badge>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Account</th>
                <th className="px-5 py-3 text-right">Debit</th>
                <th className="px-5 py-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.rows.map((row) => (
                <tr key={row.accountId} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-text-tertiary">{row.code}</td>
                  <td className="px-5 py-2.5 text-text-primary">{row.name}</td>
                  <td className="px-5 py-2.5 text-right text-text-primary">
                    {row.debit > 0 ? formatCurrency(row.debit, currency) : "—"}
                  </td>
                  <td className="px-5 py-2.5 text-right text-text-primary">
                    {row.credit > 0 ? formatCurrency(row.credit, currency) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-background font-semibold text-text-primary">
                <td className="px-5 py-3" colSpan={2}>
                  Total
                </td>
                <td className="px-5 py-3 text-right">{formatCurrency(trialBalance.totalDebit, currency)}</td>
                <td className="px-5 py-3 text-right">{formatCurrency(trialBalance.totalCredit, currency)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
