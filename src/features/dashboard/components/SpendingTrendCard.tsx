import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatCurrency } from "@/lib/utils/currency";

interface SpendingTrendCardProps {
  data: { day: number; amount: number }[];
  currency: string;
}

export function SpendingTrendCard({ data, currency }: SpendingTrendCardProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Spending Trend</CardTitle>
          <CardDescription>Daily spending in {currency}</CardDescription>
        </div>
        <span className="rounded-lg border border-border-strong px-2.5 py-1 text-xs font-medium text-text-secondary">
          Daily
        </span>
      </CardHeader>
      <CardContent className="pl-1">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendingTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                tickFormatter={(day: number) => `${day} May`}
                interval={4}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
                      <p className="font-medium text-text-secondary">{label} May</p>
                      <p className="font-semibold text-text-primary">
                        {formatCurrency(payload[0].value as number, currency)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--color-primary-500)"
                strokeWidth={2}
                fill="url(#spendingTrendFill)"
                isAnimationActive={!reducedMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
