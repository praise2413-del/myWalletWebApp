import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InsightCard } from "@/features/insights/components/InsightCard";
import type { AllocationInsightResult } from "@/lib/insights/allocation";
import type { Insight } from "@/types";

interface AllocationInsightSectionProps {
  result: AllocationInsightResult | null;
  historical: Insight[];
}

export function AllocationInsightSection({ result, historical }: AllocationInsightSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Savings & Investment</CardTitle>
          <CardDescription>How much of your income you're setting aside</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!result || result.status === "no-income" || result.status === "no-allocation" ? (
          <p className="py-4 text-center text-sm text-text-tertiary">
            {result?.message ?? "Add income records to start tracking your savings and investment allocation."}
          </p>
        ) : (
          <InsightCard insight={result.insight} />
        )}

        {historical.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {historical.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
