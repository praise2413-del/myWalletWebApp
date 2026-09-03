import { InsightCard } from "@/features/insights/components/InsightCard";
import type { ReportInsight, ReportModel } from "@/features/reports/lib/reportModel";

const SECTION_HEADING: Record<ReportInsight["section"], string> = {
  income: "Income Insights",
  spending: "Spending Insights",
  allocation: "Allocation Insights",
  behavioral: "Ongoing Patterns",
};

const SECTION_ORDER: ReportInsight["section"][] = ["income", "spending", "allocation", "behavioral"];

export function InsightsSection({ model }: { model: ReportModel }) {
  const groups = SECTION_ORDER.map((section) => ({
    section,
    items: model.insights.filter((i) => i.section === section),
  })).filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="border-t border-border px-6 py-8">
      <h2 className="text-base font-semibold text-text-primary">Financial Insights</h2>

      <div className="mt-4 space-y-6">
        {groups.map((group) => (
          <div key={group.section}>
            <h3 className="mb-2 text-sm font-semibold text-text-secondary">{SECTION_HEADING[group.section]}</h3>
            <div className="space-y-3">
              {group.items.map((item) => (
                <InsightCard key={item.insight.id} insight={item.insight} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
