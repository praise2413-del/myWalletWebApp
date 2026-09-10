import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import type { CashFlowStatement } from "@/features/business/lib/statements";
import { formatCurrency } from "@/lib/utils/currency";

function Row({ label, amount, currency, bold }: { label: string; amount: number; currency: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-5 py-2.5 text-sm ${bold ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
      <span>{label}</span>
      <span className={bold ? "text-text-primary" : "font-medium text-text-primary"}>{formatCurrency(amount, currency)}</span>
    </div>
  );
}

export function CashFlowStatementView({ statement, currency }: { statement: CashFlowStatement; currency: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="text-sm font-medium text-text-primary">Statement of Cash Flows</p>
        <Badge tone={statement.isReconciled ? "income" : "expense"}>
          {statement.isReconciled ? "Reconciled" : "Not reconciled"}
        </Badge>
      </div>
      <CardContent className="divide-y divide-border p-0">
        <Row label="Cash from Operating Activities" amount={statement.operating} currency={currency} />
        <Row label="Cash from Investing Activities" amount={statement.investing} currency={currency} />
        <Row label="Cash from Financing Activities" amount={statement.financing} currency={currency} />
        <Row label="Net Change in Cash" amount={statement.netChangeFromActivities} currency={currency} bold />
        <Row label="Opening Cash Balance" amount={statement.openingCash} currency={currency} />
        <Row label="Closing Cash Balance" amount={statement.closingCash} currency={currency} bold />
      </CardContent>
    </Card>
  );
}
