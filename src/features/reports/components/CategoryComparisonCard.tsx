import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { getChartSeriesColor } from "@/lib/utils/categoryVisuals";
import { formatCurrency } from "@/lib/utils/currency";

interface CategoryComparisonCardProps {
  data: { name: string; amount: number }[];
  currency: string;
}

export function CategoryComparisonCard({ data, currency }: CategoryComparisonCardProps) {
  const reducedMotion = usePrefersReducedMotion();
  // recharts renders the first data item at the top of a vertical category axis,
  // so sort descending to put the largest category first (highest to lowest, top to bottom).
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const height = Math.max(200, sorted.length * 44);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Category Comparison</CardTitle>
          <CardDescription>Which categories consumed the most money</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-tertiary">No expenses recorded for this period yet.</p>
        ) : (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                  tickFormatter={(v: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-background)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as { name: string; amount: number };
                    return (
                      <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
                        <p className="font-semibold text-text-primary">{item.name}</p>
                        <p className="text-text-secondary">{formatCurrency(item.amount, currency)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]} isAnimationActive={!reducedMotion} maxBarSize={22}>
                  {sorted.map((entry, index) => (
                    <Cell key={entry.name} fill={getChartSeriesColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
