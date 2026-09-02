import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatCurrency } from "@/lib/utils/currency";

interface SpendingTrendCardProps {
  data: { date: string; amount: number }[];
  currency: string;
  bucket: "day" | "month";
}

function formatTick(dateKey: string, bucket: "day" | "month"): string {
  const date = new Date(`${dateKey}T00:00:00`);
  return bucket === "day"
    ? date.toLocaleDateString("en-US", { day: "numeric", month: "short" })
    : date.toLocaleDateString("en-US", { month: "short" });
}

export function SpendingTrendCard({ data, currency, bucket }: SpendingTrendCardProps) {
  const reducedMotion = usePrefersReducedMotion();
  const hasSpending = data.some((point) => point.amount > 0);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Spending Trend</CardTitle>
          <CardDescription>{bucket === "day" ? "Daily" : "Monthly"} spending in {currency}</CardDescription>
        </div>
        <span className="rounded-lg border border-border-strong px-2.5 py-1 text-xs font-medium text-text-secondary">
          {bucket === "day" ? "Daily" : "Monthly"}
        </span>
      </CardHeader>
      <CardContent className="pl-1">
        {!hasSpending ? (
          <div className="flex h-52 items-center justify-center text-sm text-text-tertiary">
            No spending recorded for this period yet.
          </div>
        ) : (
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
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                  tickFormatter={(key: string) => formatTick(key, bucket)}
                  interval={bucket === "day" ? Math.max(0, Math.floor(data.length / 6) - 1) : 0}
                  padding={{ left: 24, right: 24 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
                        <p className="font-medium text-text-secondary">{formatTick(label as string, bucket)}</p>
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
        )}
      </CardContent>
    </Card>
  );
}
