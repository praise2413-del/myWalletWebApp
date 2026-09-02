import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { getCategoryColor, getCategoryIcon } from "@/lib/utils/categoryVisuals";
import { formatCurrency, formatPercent, safeDivide } from "@/lib/utils/currency";
import type { NamedAmount } from "@/lib/utils/aggregate";

interface CategoryBreakdownTableProps {
  data: NamedAmount[];
  currency: string;
}

export function CategoryBreakdownTable({ data, currency }: CategoryBreakdownTableProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>Every expense category for this period</CardDescription>
        </div>
      </CardHeader>
      {data.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-text-tertiary">
          No expenses recorded for this period yet.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">% of total</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const Icon = getCategoryIcon(item.name);
                const color = getCategoryColor(item.name);
                return (
                  <tr key={item.name} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex size-7 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
                        >
                          <Icon className="size-3.5" style={{ color }} aria-hidden="true" />
                        </span>
                        <span className="font-medium text-text-primary">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-text-tertiary">
                      {formatPercent(safeDivide(item.amount, total) * 100, 1)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-text-primary">
                      {formatCurrency(item.amount, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
