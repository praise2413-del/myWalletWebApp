import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PeriodSelector } from "@/components/ui/PeriodSelector";
import { useState } from "react";

export default function ReportsPage() {
  const [period, setPeriod] = useState("Monthly");

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Understand your spending patterns over time"
        actions={
          <PeriodSelector
            options={["Daily", "Weekly", "Monthly", "Yearly", "Custom Range"]}
            value={period}
            onChange={setPeriod}
          />
        }
      />
      <EmptyState
        icon={BarChart3}
        title="Not enough data yet"
        description="Add some transactions to generate meaningful reports."
      />
    </div>
  );
}
