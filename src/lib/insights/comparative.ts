import { formatCurrency, formatPercent } from "@/lib/utils/currency";
import { percentChange } from "@/lib/utils/period";
import type { Insight } from "@/types";

export interface CategoryChange {
  name: string;
  amount: number;
  previousAmount: number;
}

export interface ComparativeInput {
  income: number;
  previousIncome: number;
  expenses: number;
  previousExpenses: number;
  categoryChanges: CategoryChange[];
  currency: string;
}

/** Ignore changes small enough to be noise rather than a meaningful shift. */
const MIN_MEANINGFUL_CHANGE_PERCENT = 3;

/**
 * Level 2 (comparative) insights: this period vs. the previous equivalent
 * period. Requires real previous-period data — never fabricates a
 * comparison when there's nothing to compare against.
 */
export function generateComparativeInsights(input: ComparativeInput): Insight[] {
  const insights: Insight[] = [];

  if (input.previousExpenses > 0) {
    const change = percentChange(input.expenses, input.previousExpenses);
    if (Math.abs(change) >= MIN_MEANINGFUL_CHANGE_PERCENT) {
      const direction = change > 0 ? "increased" : "decreased";
      insights.push({
        id: "comparative-total-expenses",
        tone: change > 0 ? "attention" : "positive",
        title: `Your spending ${direction} compared with last month`,
        explanation: `You spent ${formatPercent(Math.abs(change), 0)} ${change > 0 ? "more" : "less"} this month compared with last month.`,
        comparison: `${formatCurrency(input.previousExpenses, input.currency)} → ${formatCurrency(input.expenses, input.currency)}`,
      });
    }
  }

  if (input.previousIncome > 0) {
    const change = percentChange(input.income, input.previousIncome);
    if (Math.abs(change) >= MIN_MEANINGFUL_CHANGE_PERCENT) {
      const direction = change > 0 ? "increased" : "decreased";
      insights.push({
        id: "comparative-income",
        tone: change > 0 ? "positive" : "observation",
        title: `Your income ${direction} compared with last month`,
        explanation: `Your recorded income ${direction} by ${formatPercent(Math.abs(change), 0)} compared with last month.`,
        comparison: `${formatCurrency(input.previousIncome, input.currency)} → ${formatCurrency(input.income, input.currency)}`,
      });
    }
  }

  const categoryInsights = input.categoryChanges
    .filter((c) => c.previousAmount > 0 && c.amount > 0)
    .map((c) => ({ change: c, percent: percentChange(c.amount, c.previousAmount) }))
    .filter((c) => Math.abs(c.percent) >= MIN_MEANINGFUL_CHANGE_PERCENT)
    .sort((a, b) => Math.abs(b.change.amount - b.change.previousAmount) - Math.abs(a.change.amount - a.change.previousAmount))
    .slice(0, 3);

  for (const { change, percent } of categoryInsights) {
    const direction = percent > 0 ? "increased" : "decreased";
    const delta = Math.abs(change.amount - change.previousAmount);
    insights.push({
      id: `comparative-category-${change.name}`,
      tone: percent > 0 ? "attention" : "positive",
      title: `${change.name} spending ${direction} compared with last month`,
      explanation: `You spent ${formatCurrency(delta, input.currency)} ${percent > 0 ? "more" : "less"} on ${change.name} than last month (${formatPercent(Math.abs(percent), 0)} ${direction}).`,
      comparison: `${formatCurrency(change.previousAmount, input.currency)} → ${formatCurrency(change.amount, input.currency)}`,
    });
  }

  return insights;
}
