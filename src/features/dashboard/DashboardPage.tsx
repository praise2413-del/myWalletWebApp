import { useState } from "react";
import { PeriodSelector } from "@/components/ui/PeriodSelector";
import { FinancialInsightCard } from "@/features/dashboard/components/FinancialInsightCard";
import { RecentTransactionsCard } from "@/features/dashboard/components/RecentTransactionsCard";
import { SpendingOverviewCard } from "@/features/dashboard/components/SpendingOverviewCard";
import { SpendingTrendCard } from "@/features/dashboard/components/SpendingTrendCard";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { TopCategoriesCard } from "@/features/dashboard/components/TopCategoriesCard";
import {
  MOCK_DASHBOARD_INSIGHT,
  MOCK_RECENT_TRANSACTIONS,
  MOCK_SPENDING_BY_CATEGORY,
  MOCK_SPENDING_TREND,
  MOCK_SUMMARY,
} from "@/lib/mock/dashboardMock";
import { MOCK_CURRENT_USER } from "@/lib/mock/currentUser";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [period, setPeriod] = useState("This Month");
  const currency = MOCK_CURRENT_USER.currency;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {getGreeting()}, {MOCK_CURRENT_USER.firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Here&apos;s what&apos;s happening with your finances today.
          </p>
        </div>
        <PeriodSelector
          options={["This Week", "This Month", "This Year"]}
          value={period}
          onChange={setPeriod}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current Balance"
          amount={MOCK_SUMMARY.balance}
          currency={currency}
          changePercent={MOCK_SUMMARY.deltas.balance}
        />
        <StatCard
          label="Total Income"
          amount={MOCK_SUMMARY.income}
          currency={currency}
          changePercent={MOCK_SUMMARY.deltas.income}
        />
        <StatCard
          label="Total Expenses"
          amount={MOCK_SUMMARY.expenses}
          currency={currency}
          changePercent={MOCK_SUMMARY.deltas.expenses}
          increaseIsGood={false}
        />
        <StatCard
          label="Net Cash Flow"
          amount={MOCK_SUMMARY.netCashFlow}
          currency={currency}
          changePercent={MOCK_SUMMARY.deltas.netCashFlow}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SpendingOverviewCard data={MOCK_SPENDING_BY_CATEGORY} currency={currency} />
        </div>
        <FinancialInsightCard title={MOCK_DASHBOARD_INSIGHT.title} body={MOCK_DASHBOARD_INSIGHT.body} />
        <RecentTransactionsCard transactions={MOCK_RECENT_TRANSACTIONS} currency={currency} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendingTrendCard data={MOCK_SPENDING_TREND} currency={currency} />
        </div>
        <TopCategoriesCard data={MOCK_SPENDING_BY_CATEGORY} currency={currency} />
      </div>
    </div>
  );
}
