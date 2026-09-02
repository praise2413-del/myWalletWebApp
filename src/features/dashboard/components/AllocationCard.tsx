import { PiggyBank } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { getAllocationInsight } from "@/lib/insights/allocation";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

interface AllocationCardProps {
  income: number;
  savings: number;
  investment: number;
  target: number;
  currency: string;
}

export function AllocationCard({ income, savings, investment, target, currency }: AllocationCardProps) {
  const result = getAllocationInsight({ income, savings, investment, target, currency });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Savings & Investment</CardTitle>
          <CardDescription>This period's allocation</CardDescription>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <PiggyBank className="size-4.5 text-primary-600 dark:text-primary-500" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        {result.status === "no-income" || result.status === "no-allocation" ? (
          <p className="text-sm text-text-secondary">{result.message}</p>
        ) : (
          <>
            <p className="text-3xl font-bold tracking-tight text-text-primary">
              {formatPercent(result.calculation.rate, 1)}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {formatCurrency(result.calculation.totalAllocated, currency)} allocated of{" "}
              {formatCurrency(result.calculation.income, currency)} income
            </p>

            <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background">
              <div
                className={cn(
                  "h-full rounded-full",
                  result.calculation.tone === "positive" ? "bg-primary-500" : "bg-primary-400",
                )}
                style={{ width: `${Math.min(result.calculation.rate, 100)}%` }}
              />
              <div
                className="absolute top-0 h-full w-0.5 bg-text-primary/40"
                style={{ left: `${Math.min(result.calculation.target, 100)}%` }}
                aria-hidden="true"
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-text-tertiary">
              <span>Target: {formatPercent(result.calculation.target, 0)}</span>
              <span
                className={cn(
                  "font-medium",
                  result.calculation.tone === "positive" ? "text-income-600" : "text-text-secondary",
                )}
              >
                {result.insight.title}
              </span>
            </div>
          </>
        )}

        <Link
          to="/insights"
          className="mt-4 inline-block text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
        >
          View insights →
        </Link>
      </CardContent>
    </Card>
  );
}
