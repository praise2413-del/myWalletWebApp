import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BudgetsView } from "@/features/business/components/planning/BudgetsView";
import { GoalsView } from "@/features/business/components/planning/GoalsView";
import { PaymentCalendarView } from "@/features/business/components/planning/PaymentCalendarView";
import { useBusinessLedgerLines } from "@/features/business/hooks/useBusinessLedgerLines";
import { cn } from "@/lib/utils/cn";

type PlanningTab = "BUDGETS" | "GOALS" | "CALENDAR";

const TABS: { id: PlanningTab; label: string }[] = [
  { id: "BUDGETS", label: "Budgets" },
  { id: "GOALS", label: "Goals" },
  { id: "CALENDAR", label: "Payment Calendar" },
];

export default function BusinessPlanningPage() {
  const [tab, setTab] = useState<PlanningTab>("BUDGETS");
  const { lines, loading } = useBusinessLedgerLines();

  return (
    <div>
      <PageHeader title="Planning" description="Budgets, goals, and upcoming receivables/payables — all derived live from your books." />

      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t.id ? "bg-primary-600 text-white" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "BUDGETS" && <BudgetsView lines={lines} loading={loading} />}
      {tab === "GOALS" && <GoalsView lines={lines} loading={loading} />}
      {tab === "CALENDAR" && <PaymentCalendarView />}
    </div>
  );
}
