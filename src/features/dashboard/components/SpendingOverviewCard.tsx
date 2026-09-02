import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { getChartSeriesColor } from "@/lib/utils/categoryVisuals";
import { formatCurrency, formatPercent, safeDivide } from "@/lib/utils/currency";

interface SpendingOverviewCardProps {
  data: { name: string; amount: number }[];
  currency: string;
}

export function SpendingOverviewCard({ data, currency }: SpendingOverviewCardProps) {
  const reducedMotion = usePrefersReducedMotion();
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const chartData = data.map((item, index) => ({
    ...item,
    color: getChartSeriesColor(index),
    percent: safeDivide(item.amount, total) * 100,
  }));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Spending Overview</CardTitle>
          <CardDescription>Where your money went this period</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-tertiary">
            No expenses recorded for this period yet.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="relative size-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius="68%"
                    outerRadius="100%"
                    paddingAngle={2}
                    strokeWidth={0}
                    isAnimationActive={!reducedMotion}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload as (typeof chartData)[number];
                      return (
                        <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
                          <p className="font-semibold text-text-primary">{item.name}</p>
                          <p className="text-text-secondary">{formatCurrency(item.amount, currency)}</p>
                          <p className="text-text-tertiary">{formatPercent(item.percent)} of total expenses</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] text-text-tertiary">{currency}</span>
                <span className="text-lg font-bold text-text-primary">
                  {new Intl.NumberFormat("en-US", { notation: "compact" }).format(total)}
                </span>
                <span className="text-[10px] text-text-tertiary">Total Expenses</span>
              </div>
            </div>

            <ul className="w-full flex-1 space-y-2.5">
              {chartData.map((item) => (
                <li key={item.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-text-secondary">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="whitespace-nowrap text-text-tertiary">{formatPercent(item.percent, 0)}</span>
                  <span className="whitespace-nowrap text-right font-medium text-text-primary">
                    {formatCurrency(item.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
