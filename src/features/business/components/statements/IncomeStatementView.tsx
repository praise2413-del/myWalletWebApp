import { Card, CardContent } from "@/components/ui/Card";
import type { IncomeStatement, StatementLineAmount } from "@/features/business/lib/statements";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

function Section({ title, rows, total, currency }: { title: string; rows: StatementLineAmount[]; total: number; currency: string }) {
  return (
    <div>
      <p className="border-b border-border px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-text-tertiary">{title}</p>
      {rows.length === 0 ? (
        <p className="px-5 py-3 text-sm text-text-tertiary">No activity in this period.</p>
      ) : (
        rows.map((row) => (
          <div key={row.accountId} className="flex items-center justify-between px-5 py-2 text-sm">
            <span className="text-text-secondary">{row.name}</span>
            <span className="font-medium text-text-primary">{formatCurrency(row.amount, currency)}</span>
          </div>
        ))
      )}
      <div className="flex items-center justify-between border-t border-border bg-background px-5 py-2.5 text-sm font-semibold text-text-primary">
        <span>Total {title}</span>
        <span>{formatCurrency(total, currency)}</span>
      </div>
    </div>
  );
}

export function IncomeStatementView({ statement, currency }: { statement: IncomeStatement; currency: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="divide-y divide-border p-0">
        <Section title="Revenue" rows={statement.revenueRows} total={statement.totalRevenue} currency={currency} />
        <Section title="Expenses" rows={statement.expenseRows} total={statement.totalExpense} currency={currency} />
        <div
          className={cn(
            "flex items-center justify-between px-5 py-3.5 text-base font-bold",
            statement.netProfit >= 0 ? "text-income-600" : "text-expense-600",
          )}
        >
          <span>Net {statement.netProfit >= 0 ? "Profit" : "Loss"}</span>
          <span>{formatCurrency(Math.abs(statement.netProfit), currency)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
