import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { InsightCard } from "@/features/insights/components/InsightCard";
import { buildBusinessHealth, buildBusinessRatioInsights, type HealthBand } from "@/features/business/lib/businessHealth";
import { useBusinessLedgerLines } from "@/features/business/hooks/useBusinessLedgerLines";
import { buildBusinessRatios } from "@/features/business/lib/ratios";
import { buildBalanceSheet, buildIncomeStatement } from "@/features/business/lib/statements";
import { useBusiness } from "@/hooks/useBusiness";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { getPeriodRange, toDateKey } from "@/lib/utils/period";

type Period = "This Month" | "This Year";

const HEALTH_BAND_STYLE: Record<HealthBand, string> = {
  Strong: "bg-income-50 text-income-700 dark:text-income-500",
  Stable: "bg-warning-50 text-warning-700",
  "Needs Attention": "bg-expense-50 text-expense-700 dark:text-expense-500",
};

function RatioCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{value}</p>
      <p className="mt-2 text-xs text-text-tertiary">{hint}</p>
    </Card>
  );
}

export default function BusinessInsightsPage() {
  const { activeBusiness } = useBusiness();
  const currency = activeBusiness?.currency ?? "TZS";
  const { lines, loading, error } = useBusinessLedgerLines();
  const [period, setPeriod] = useState<Period>("This Month");

  const range = useMemo(() => getPeriodRange(period), [period]);
  const dateFrom = toDateKey(range.start);
  const dateTo = toDateKey(range.end);
  const previousFrom = toDateKey(range.previousStart);
  const previousTo = toDateKey(range.previousEnd);

  const { ratios, health, insights } = useMemo(() => {
    const bs = buildBalanceSheet(lines, dateTo);
    const is = buildIncomeStatement(lines, dateFrom, dateTo);
    const currentRatios = buildBusinessRatios(lines, dateTo, bs, is);

    const prevBs = buildBalanceSheet(lines, previousTo);
    const prevIs = buildIncomeStatement(lines, previousFrom, previousTo);
    const prevRatios = buildBusinessRatios(lines, previousTo, prevBs, prevIs);

    return {
      ratios: currentRatios,
      health: buildBusinessHealth(currentRatios),
      insights: buildBusinessRatioInsights(currentRatios, prevRatios, currency),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, dateFrom, dateTo, previousFrom, previousTo, currency]);

  return (
    <div>
      <PageHeader
        title="Business Insights"
        description="Financial ratios and a plain-language read on how the business is doing."
        actions={
          <div className="inline-flex gap-1 rounded-lg border border-border bg-surface p-1">
            {(["This Month", "This Year"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  period === p ? "bg-primary-600 text-white" : "text-text-secondary hover:text-text-primary",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <AlertBanner message={error} />
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Business Health</CardTitle>
              <Badge className={HEALTH_BAND_STYLE[health.band]}>{health.band}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">{health.summary}</p>
              {health.factors.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {health.factors.map((f) => (
                    <div key={f.label} className="rounded-lg bg-background p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">{f.label}</span>
                        <Badge className={HEALTH_BAND_STYLE[f.band]}>{f.band}</Badge>
                      </div>
                      <p className="mt-1.5 text-xs text-text-secondary">{f.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Ratios · {period}</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <RatioCard label="Current Ratio" value={ratios.currentRatio === null ? "—" : ratios.currentRatio.toFixed(2)} hint="Short-term assets ÷ short-term liabilities" />
              <RatioCard label="Quick Ratio" value={ratios.quickRatio === null ? "—" : ratios.quickRatio.toFixed(2)} hint="Excludes inventory from current assets" />
              <RatioCard label="Working Capital" value={formatCurrency(ratios.workingCapital, currency)} hint="Current assets minus current liabilities" />
              <RatioCard label="Debt-to-Equity" value={ratios.debtToEquity === null ? "—" : ratios.debtToEquity.toFixed(2)} hint="Total liabilities ÷ total equity" />
              <RatioCard label="Net Profit Margin" value={ratios.netProfitMargin === null ? "—" : `${ratios.netProfitMargin.toFixed(1)}%`} hint="Net profit ÷ revenue, this period" />
              <RatioCard label="Return on Assets" value={ratios.returnOnAssets === null ? "—" : `${ratios.returnOnAssets.toFixed(1)}%`} hint="Net profit ÷ total assets" />
            </div>
          </div>

          {insights.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-text-primary">Insights</h2>
              <div className="space-y-3">
                {insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
