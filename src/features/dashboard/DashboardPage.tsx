import { useState } from "react";
import { PeriodSelector } from "@/components/ui/PeriodSelector";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { AllocationCard } from "@/features/dashboard/components/AllocationCard";
import { FinancialInsightCard } from "@/features/dashboard/components/FinancialInsightCard";
import { RecentTransactionsCard } from "@/features/dashboard/components/RecentTransactionsCard";
import { SpendingOverviewCard } from "@/features/dashboard/components/SpendingOverviewCard";
import { SpendingTrendCard } from "@/features/dashboard/components/SpendingTrendCard";
import { StatCard } from "@/components/ui/StatCard";
import { TopCategoriesCard } from "@/features/dashboard/components/TopCategoriesCard";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import { getTopCategoryInsight } from "@/lib/insights/spending";
import type { DashboardPeriod } from "@/lib/utils/period";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const PERIOD_OPTIONS: DashboardPeriod[] = ["This Week", "This Month", "This Year"];

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("This Month");
  const { profile, user } = useAuth();
  const currency = profile?.currency ?? "TZS";
  const firstName = profile?.fullName?.trim().split(" ")[0] || user?.email?.split("@")[0] || "there";

  const { data, loading, error } = useDashboardData(period);
  const insight = getTopCategoryInsight(data.spendingByCategory, data.summary.expenses, currency);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Here&apos;s what&apos;s happening with your finances today.
          </p>
        </div>
        <PeriodSelector
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(value) => setPeriod(value as DashboardPeriod)}
        />
      </div>

      {error && <AlertBanner message={error} />}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Current Balance"
              amount={data.summary.balance}
              currency={currency}
              changePercent={data.summary.deltas.balance}
            />
            <StatCard
              label="Total Income"
              amount={data.summary.income}
              currency={currency}
              changePercent={data.summary.deltas.income}
            />
            <StatCard
              label="Total Expenses"
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <SpendingOverviewCard data={data.spendingByCategory} currency={currency} />
            </div>
            <FinancialInsightCard title={insight?.title} body={insight?.body} />
            <RecentTransactionsCard transactions={data.recentTransactions} currency={currency} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SpendingTrendCard data={data.spendingTrend} currency={currency} bucket={data.trendBucket} />
            </div>
            <div className="flex flex-col gap-4">
              <TopCategoriesCard data={data.spendingByCategory} currency={currency} />
              <AllocationCard
                income={data.summary.income}
                savings={data.allocation.savings}
                investment={data.allocation.investment}
                target={profile?.allocationTarget ?? 30}
                currency={currency}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
