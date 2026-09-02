import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatCurrency } from "@/lib/utils/currency";

interface IncomeVsExpenseCardProps {
  income: number;
  expenses: number;
  currency: string;
}

export function IncomeVsExpenseCard({ income, expenses, currency }: IncomeVsExpenseCardProps) {
  const reducedMotion = usePrefersReducedMotion();
  const data = [
    { name: "Income", amount: income, color: "var(--color-income-500)" },
    { name: "Expenses", amount: expenses, color: "var(--color-expense-500)" },
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Income vs Expense</CardTitle>
          <CardDescription>Did income cover spending this period?</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {income === 0 && expenses === 0 ? (
          <p className="py-8 text-center text-sm text-text-tertiary">No activity recorded for this period yet.</p>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                  tickFormatter={(v: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(v)}
                  width={44}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-background)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as (typeof data)[number];
                    return (
                      <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
                        <p className="font-semibold text-text-primary">{item.name}</p>
                        <p className="text-text-secondary">{formatCurrency(item.amount, currency)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} isAnimationActive={!reducedMotion} maxBarSize={64}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
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
