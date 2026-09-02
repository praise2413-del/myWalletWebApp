import { Card } from "@/components/ui/Card";
import { TrendBadge } from "@/components/ui/TrendBadge";
import { formatCurrency } from "@/lib/utils/currency";

interface StatCardProps {
  label: string;
  amount: number;
  currency: string;
  changePercent: number;
  increaseIsGood?: boolean;
}

export function StatCard({ label, amount, currency, changePercent, increaseIsGood = true }: StatCardProps) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
        {formatCurrency(amount, currency)}
      </p>
      <div className="mt-2">
        <TrendBadge changePercent={changePercent} increaseIsGood={increaseIsGood} />
      </div>
    </Card>
  );
}
