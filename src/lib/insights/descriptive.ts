import { formatCurrency } from "@/lib/utils/currency";
import type { NamedAmount } from "@/lib/utils/aggregate";
import type { Insight } from "@/types";

export interface DescriptiveInput {
  income: number;
  expenses: number;
  netCashFlow: number;
  topCategory: NamedAmount | null;
  currency: string;
  /** e.g. "this month" — used in generated sentences. */
  periodLabel: string;
}

/**
 * Level 1 (descriptive) insights: plain facts read straight off the current
 * period's data. Never invents a comparison or a pattern — that's what
 * comparative.ts and behavioral.ts are for.
 */
export function generateDescriptiveInsights(input: DescriptiveInput): Insight[] {
  const insights: Insight[] = [];

  if (input.expenses > 0) {
    insights.push({
      id: "descriptive-total-spent",
      tone: "observation",
      title: `You spent ${formatCurrency(input.expenses, input.currency)} ${input.periodLabel}`,
      explanation: `Your total recorded expenses ${input.periodLabel} were ${formatCurrency(input.expenses, input.currency)}.`,
    });
  }

  if (input.topCategory) {
    insights.push({
      id: "descriptive-top-category",
      tone: "observation",
      title: `${input.topCategory.name} was your largest expense category`,
      explanation: `You spent ${formatCurrency(input.topCategory.amount, input.currency)} on ${input.topCategory.name} ${input.periodLabel}.`,
    });
  }

  if (input.income > 0) {
    insights.push({
      id: "descriptive-income",
      tone: "positive",
      title: `You received ${formatCurrency(input.income, input.currency)} in recorded income`,
      explanation: `Your total recorded income ${input.periodLabel} was ${formatCurrency(input.income, input.currency)}.`,
    });
  }

  if (input.income > 0 || input.expenses > 0) {
    insights.push({
      id: "descriptive-net-cash-flow",
      tone: input.netCashFlow >= 0 ? "positive" : "attention",
      title:
        input.netCashFlow >= 0 ? "Your net cash flow was positive" : "Your expenses exceeded your recorded income",
      explanation: `Your net cash flow ${input.periodLabel} was ${formatCurrency(input.netCashFlow, input.currency)}.`,
    });
  }

  return insights;
}
