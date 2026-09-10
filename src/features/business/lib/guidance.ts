import type { BusinessHealth } from "@/features/business/lib/businessHealth";
import type { Forecast } from "@/features/business/lib/forecast";
import { formatCurrency } from "@/lib/utils/currency";
import type { Insight } from "@/types";

export interface BudgetOverrun {
  accountName: string;
  actual: number;
  budgeted: number;
}

export interface GuidanceInput {
  health: BusinessHealth;
  forecast: Forecast | null;
  budgetOverruns: BudgetOverrun[];
  overduePayables: { count: number; total: number };
  overdueReceivables: { count: number; total: number };
  currency: string;
}

let counter = 0;
function insight(tone: Insight["tone"], title: string, explanation: string): Insight {
  counter += 1;
  return { id: `guidance-${counter}`, tone, title, explanation };
}

/**
 * A deterministic, rule-based synthesis across everything else this
 * module already computes (health, forecast, budgets, upcoming
 * payments) — forward-looking and actionable, distinct from Phase 6's
 * ratio-descriptive insights. No generative AI: same "describe facts,
 * don't judge" rule as every other insight engine in this project.
 */
export function buildGuidanceInsights(input: GuidanceInput): Insight[] {
  const insights: Insight[] = [];

  if (input.overduePayables.count > 0) {
    insights.push(
      insight(
        "attention",
        `${input.overduePayables.count} overdue ${input.overduePayables.count === 1 ? "bill" : "bills"}`,
        `${formatCurrency(input.overduePayables.total, input.currency)} in supplier bills are past their due date.`,
      ),
    );
  }

  if (input.overdueReceivables.count > 0) {
    insights.push(
      insight(
        "attention",
        `${input.overdueReceivables.count} overdue ${input.overdueReceivables.count === 1 ? "invoice" : "invoices"}`,
        `${formatCurrency(input.overdueReceivables.total, input.currency)} in customer invoices are past their due date — following up could improve cash flow.`,
      ),
    );
  }

  for (const overrun of input.budgetOverruns) {
    insights.push(
      insight(
        "attention",
        `${overrun.accountName} is over budget`,
        `Actual spend of ${formatCurrency(overrun.actual, input.currency)} has passed the ${formatCurrency(overrun.budgeted, input.currency)} budget for this month.`,
      ),
    );
  }

  if (input.health.band === "Needs Attention") {
    insights.push(insight("attention", "Business health needs attention", input.health.summary));
  }

  if (input.forecast) {
    if (input.forecast.trend === "down") {
      insights.push(
        insight(
          "attention",
          "Net profit trend is declining",
          `Based on the last ${input.forecast.monthsUsed} completed ${input.forecast.monthsUsed === 1 ? "month" : "months"}, net profit has been trending down.`,
        ),
      );
    } else if (input.forecast.trend === "up") {
      insights.push(
        insight(
          "positive",
          "Net profit trend is improving",
          `Based on the last ${input.forecast.monthsUsed} completed ${input.forecast.monthsUsed === 1 ? "month" : "months"}, net profit has been trending up.`,
        ),
      );
    }
  }

  if (insights.length === 0) {
    insights.push(
      insight(
        "positive",
        "No urgent issues detected",
        "No overdue bills or invoices, no budgets over their limit, and business health looks stable or strong for this period.",
      ),
    );
  }

  return insights;
}
