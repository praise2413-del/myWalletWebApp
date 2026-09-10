import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import type { BalanceSheet, StatementLineAmount } from "@/features/business/lib/statements";
import { formatCurrency } from "@/lib/utils/currency";

function Section({
  title,
  rows,
  total,
  currency,
  extraRow,
}: {
  title: string;
  rows: StatementLineAmount[];
  total: number;
  currency: string;
  extraRow?: { label: string; amount: number };
}) {
  return (
    <div>
      <p className="border-b border-border px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-text-tertiary">{title}</p>
      {rows.length === 0 && !extraRow ? (
        <p className="px-5 py-3 text-sm text-text-tertiary">No activity yet.</p>
      ) : (
        <>
          {rows.map((row) => (
            <div key={row.accountId} className="flex items-center justify-between px-5 py-2 text-sm">
              <span className="text-text-secondary">{row.name}</span>
              <span className="font-medium text-text-primary">{formatCurrency(row.amount, currency)}</span>
            </div>
          ))}
          {extraRow && (
            <div className="flex items-center justify-between px-5 py-2 text-sm">
              <span className="text-text-secondary">{extraRow.label}</span>
              <span className="font-medium text-text-primary">{formatCurrency(extraRow.amount, currency)}</span>
            </div>
          )}
        </>
      )}
      <div className="flex items-center justify-between border-t border-border bg-background px-5 py-2.5 text-sm font-semibold text-text-primary">
        <span>Total {title}</span>
        <span>{formatCurrency(total, currency)}</span>
      </div>
    </div>
  );
}

export function BalanceSheetView({ balanceSheet, currency }: { balanceSheet: BalanceSheet; currency: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="text-sm font-medium text-text-primary">Balance Sheet</p>
        <Badge tone={balanceSheet.isBalanced ? "income" : "expense"}>
          {balanceSheet.isBalanced ? "Balanced" : "Out of balance"}
        </Badge>
      </div>
      <CardContent className="divide-y divide-border p-0">
        <Section title="Assets" rows={balanceSheet.assetRows} total={balanceSheet.totalAssets} currency={currency} />
        <Section title="Liabilities" rows={balanceSheet.liabilityRows} total={balanceSheet.totalLiabilities} currency={currency} />
        <Section
          title="Equity"
          rows={balanceSheet.equityRows}
          total={balanceSheet.totalEquity}
          currency={currency}
          extraRow={{ label: "Net Income (Current)", amount: balanceSheet.netIncomeToDate }}
        />
        <div className="flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-text-primary">
          <span>Total Liabilities + Equity</span>
          <span>{formatCurrency(balanceSheet.totalLiabilities + balanceSheet.totalEquity, currency)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
