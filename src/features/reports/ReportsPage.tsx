import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
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

  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [customStart, setCustomStart] = useState(firstOfMonth());
  const [customEnd, setCustomEnd] = useState(today());

  const customRange = useMemo(() => {
    if (period !== "custom" || !customStart || !customEnd) return undefined;
    if (customStart > customEnd) return undefined;
    return { start: new Date(`${customStart}T00:00:00`), end: new Date(`${customEnd}T00:00:00`) };
  }, [period, customStart, customEnd]);

  const { data, loading, error } = useReportsData(period, customRange);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Understand your spending patterns over time" />

      <ReportPeriodControls
        period={period}
        onPeriodChange={setPeriod}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
      />

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
