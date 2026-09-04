import { FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { AllocationCard } from "@/features/dashboard/components/AllocationCard";
import { SpendingOverviewCard } from "@/features/dashboard/components/SpendingOverviewCard";
import { SpendingTrendCard } from "@/features/dashboard/components/SpendingTrendCard";
import { CategoryBreakdownTable } from "@/features/reports/components/CategoryBreakdownTable";
import { CategoryChangesCard } from "@/features/reports/components/CategoryChangesCard";
import { CategoryComparisonCard } from "@/features/reports/components/CategoryComparisonCard";
import { IncomeVsExpenseCard } from "@/features/reports/components/IncomeVsExpenseCard";
import { ReportHighlights } from "@/features/reports/components/ReportHighlights";
import { ReportPeriodControls } from "@/features/reports/components/ReportPeriodControls";
import { ReportPreviewOverlay } from "@/features/reports/components/preview/ReportPreviewOverlay";
import { useReportsData } from "@/features/reports/hooks/useReportsData";
import { useAuth } from "@/hooks/useAuth";
import { toDateKey } from "@/lib/utils/period";
import type { ReportPeriod } from "@/types";

function today(): string {
  return toDateKey(new Date());
}

function firstOfMonth(): string {
  const d = new Date();
  return toDateKey(new Date(d.getFullYear(), d.getMonth(), 1));
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const currency = profile?.currency ?? "TZS";

  // A notification's "View Report" link deep-links here with the exact
  // period it refers to, e.g. /reports?period=custom&start=2026-08-31&
  // end=2026-09-06&openReport=1 — reusing this same Reports engine and
  // preview rather than a second reporting path.
  const [searchParams] = useSearchParams();
  const deepLinkStart = searchParams.get("start");
  const deepLinkEnd = searchParams.get("end");
  const hasDeepLinkRange = searchParams.get("period") === "custom" && !!deepLinkStart && !!deepLinkEnd;
  const shouldAutoOpenReport = searchParams.get("openReport") === "1" && hasDeepLinkRange;

  const [period, setPeriod] = useState<ReportPeriod>(hasDeepLinkRange ? "custom" : "monthly");
  const [customStart, setCustomStart] = useState(hasDeepLinkRange ? (deepLinkStart as string) : firstOfMonth());
  const [customEnd, setCustomEnd] = useState(hasDeepLinkRange ? (deepLinkEnd as string) : today());

  const customRange = useMemo(() => {
    if (period !== "custom" || !customStart || !customEnd) return undefined;
    if (customStart > customEnd) return undefined;
    return { start: new Date(`${customStart}T00:00:00`), end: new Date(`${customEnd}T00:00:00`) };
  }, [period, customStart, customEnd]);

  const { data, loading, error } = useReportsData(period, customRange);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [autoOpenHandled, setAutoOpenHandled] = useState(false);

  useEffect(() => {
    if (shouldAutoOpenReport && !loading && !error && !autoOpenHandled) {
      setPreviewOpen(true);
      setAutoOpenHandled(true);
    }
  }, [shouldAutoOpenReport, loading, error, autoOpenHandled]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Understand your spending patterns over time" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ReportPeriodControls
          period={period}
          onPeriodChange={setPeriod}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
        />
        <Button onClick={() => setPreviewOpen(true)} disabled={loading || !!error} className="shrink-0">
          <FileText className="size-4" aria-hidden="true" />
          Generate Report
        </Button>
      </div>

      {error && <AlertBanner message={error} />}

      {loading ? (
        <ReportsSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Income"
              amount={data.summary.income}
              currency={currency}
              changePercent={data.summary.deltas.income}
            />
            <StatCard
              label="Expenses"
              amount={data.summary.expenses}
              currency={currency}
              changePercent={data.summary.deltas.expenses}
              increaseIsGood={false}
            />
            <StatCard
              label="Net Cash Flow"
              amount={data.summary.netCashFlow}
              currency={currency}
              changePercent={data.summary.deltas.netCashFlow}
            />
          </div>

          <ReportHighlights
            income={data.summary.income}
            expenses={data.summary.expenses}
            netCashFlow={data.summary.netCashFlow}
            averageDailyExpense={data.summary.averageDailyExpense}
            highestCategory={data.summary.highestCategory}
            highestSpendingDay={data.summary.highestSpendingDay}
            currency={currency}
          />

          <SpendingOverviewCard data={data.categoryDistribution} currency={currency} />

          <SpendingTrendCard data={data.spendingTrend} currency={currency} bucket={data.trendBucket} />

          <CategoryComparisonCard data={data.categoryComparison} currency={currency} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <IncomeVsExpenseCard income={data.summary.income} expenses={data.summary.expenses} currency={currency} />
            <AllocationCard
              income={data.summary.income}
              savings={data.allocation.savings}
              investment={data.allocation.investment}
              target={profile?.allocationTarget ?? 30}
              currency={currency}
            />
          </div>

          <CategoryChangesCard changes={data.categoryChanges} currency={currency} />

          <CategoryBreakdownTable data={data.categoryBreakdown} currency={currency} />
        </>
      )}

      {previewOpen && (
        <ReportPreviewOverlay
          onClose={() => setPreviewOpen(false)}
          period={period}
          customRange={customRange}
          reportData={data}
          currency={currency}
          allocationTarget={profile?.allocationTarget ?? 30}
        />
      )}
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
