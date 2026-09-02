import { Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function InsightsPage() {
  return (
    <div>
      <PageHeader title="Insights" description="Discover patterns in your financial behavior" />
      <EmptyState
        icon={Lightbulb}
        title="Keep tracking"
        description="We'll show spending patterns once enough historical data is available."
      />
    </div>
  );
}
