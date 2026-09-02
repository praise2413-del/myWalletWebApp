import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendBadge } from "@/components/ui/TrendBadge";
import { formatCurrency } from "@/lib/utils/currency";
import type { CategoryChange } from "@/features/reports/hooks/useReportsData";

interface CategoryChangesCardProps {
  changes: CategoryChange[];
  currency: string;
}

export function CategoryChangesCard({ changes, currency }: CategoryChangesCardProps) {
  const meaningful = changes.filter((c) => c.amount > 0 || c.previousAmount > 0);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Category Changes</CardTitle>
          <CardDescription>vs. the previous equivalent period</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {meaningful.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-tertiary">
            Not enough historical data yet to compare categories.
          </p>
        ) : (
          <ul className="space-y-4">
            {meaningful.map((change) => (
              <li key={change.name} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{change.name}</p>
                  <p className="text-xs text-text-tertiary">
                    {formatCurrency(change.previousAmount, currency)} → {formatCurrency(change.amount, currency)}
                  </p>
                </div>
                <TrendBadge changePercent={change.changePercent} increaseIsGood={false} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
