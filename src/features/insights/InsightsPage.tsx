import { Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { AllocationInsightSection } from "@/features/insights/components/AllocationInsightSection";
import { InsightSection } from "@/features/insights/components/InsightSection";
import { useInsightsData } from "@/features/insights/hooks/useInsightsData";

export default function InsightsPage() {
  const { data, loading, error } = useInsightsData();

  const hasAnyData = data.hasAnyExpenses || data.hasAnyIncome;

  return (
    <div className="space-y-6">
      <PageHeader title="Insights" description="Discover patterns in your financial behavior" />

      {error && <AlertBanner message={error} />}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : !hasAnyData ? (
        <EmptyState
          icon={Lightbulb}
          title="Keep tracking"
          description="We'll show spending patterns once enough historical data is available."
        />
      ) : (
        <>
          <InsightSection
            title="Spending Insights"
            description="What your recorded data shows this month"
            insights={data.descriptive}
            emptyMessage="Add a few transactions this month to see insights here."
          />

          <InsightSection
            title="Comparison Insights"
            description="This month vs. last month"
            insights={data.comparative}
            emptyMessage="Not enough data yet. Keep recording transactions across a couple of months to see how things have changed."
          />

          <InsightSection
            title="Behavioral Insights"
            description="Patterns that emerge over time"
            insights={data.behavioral}
            emptyMessage="Keep tracking your finances. We'll surface meaningful patterns once enough historical data is available."
          />

          <AllocationInsightSection result={data.allocationResult} historical={data.allocationBehavioral} />
        </>
      )}
    </div>
  );
}
