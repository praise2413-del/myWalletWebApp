import { formatCurrency, formatPercent, safeDivide } from "@/lib/utils/currency";
import type { Insight, InsightTone } from "@/types";

export interface AllocationInput {
  income: number;
  savings: number;
  investment: number;
  target: number;
  currency: string;
}

export type AllocationBand = "exceeded" | "reached" | "good-progress" | "building-habit" | "overview";

export interface AllocationCalculation {
  income: number;
  totalAllocated: number;
  savings: number;
  investment: number;
  target: number;
  /** Percentage, rounded to one decimal place. */
  rate: number;
  band: AllocationBand;
  tone: InsightTone;
}

export type AllocationInsightResult =
  | { status: "no-income"; message: string }
  | { status: "no-allocation"; income: number; message: string }
  | { status: "calculated"; calculation: AllocationCalculation; insight: Insight };

/**
 * Savings & Investment Allocation % = (Savings + Investment) / Income × 100.
 * Never conflate this with expenses — it's tracked and reported separately.
 */
export function calculateAllocationRate(income: number, totalAllocated: number): number {
  const rawRate = safeDivide(totalAllocated, income) * 100;
  return Math.round(rawRate * 10) / 10;
}

/**
 * Band thresholds (20% / 10%) are fixed, shared reference points — independent
 * of the user's own configurable target, which only decides the pass/fail line.
 */
export function classifyAllocation(rate: number, target: number): { band: AllocationBand; tone: InsightTone } {
  if (rate > target) return { band: "exceeded", tone: "positive" };
  if (rate >= target) return { band: "reached", tone: "positive" };
  if (rate >= 20) return { band: "good-progress", tone: "observation" };
  if (rate >= 10) return { band: "building-habit", tone: "observation" };
  return { band: "overview", tone: "observation" };
}

export function computeAllocation(input: AllocationInput): AllocationCalculation {
  const totalAllocated = input.savings + input.investment;
  const rate = calculateAllocationRate(input.income, totalAllocated);
  const { band, tone } = classifyAllocation(rate, input.target);
  return {
    income: input.income,
    totalAllocated,
    savings: input.savings,
    investment: input.investment,
    target: input.target,
    rate,
    band,
    tone,
  };
}

function comparisonLine(calc: AllocationCalculation, currency: string): string {
  const base = `Allocated ${formatCurrency(calc.totalAllocated, currency)} of ${formatCurrency(calc.income, currency)} income · Target ${formatPercent(calc.target, 0)}`;
  if (calc.band === "exceeded") {
    const diff = Math.round((calc.rate - calc.target) * 10) / 10;
    return `${base} · +${formatPercent(diff, 1)} above target`;
  }
  return base;
}

function buildInsightCopy(calc: AllocationCalculation, currency: string): Insight {
  const rate = formatPercent(calc.rate, 1);
  const target = formatPercent(calc.target, 0);

  switch (calc.band) {
    case "exceeded":
      return {
        id: "allocation-status",
        tone: "positive",
        title: "🎉 Target exceeded!",
        explanation: `You've allocated ${rate} of your recorded income toward savings and investments this period, exceeding your ${target} target. Keep building this positive habit at a pace that remains comfortable for you.`,
        comparison: comparisonLine(calc, currency),
      };
    case "reached":
      return {
        id: "allocation-status",
        tone: "positive",
        title: "🎉 Great progress!",
        explanation: `You've allocated ${rate} of your recorded income toward savings and investments this period. That's a strong financial habit. Keep building your progress — if your financial situation allows, consider gradually increasing your allocation over time.`,
        comparison: comparisonLine(calc, currency),
      };
    case "good-progress":
      return {
        id: "allocation-status",
        tone: "observation",
        title: "Good progress",
        explanation: `You've allocated ${rate} of your recorded income toward savings and investments this period. You're making meaningful progress toward your ${target} allocation target.`,
        comparison: comparisonLine(calc, currency),
      };
    case "building-habit":
      return {
        id: "allocation-status",
        tone: "observation",
        title: "You're building the habit",
        explanation: `You've allocated ${rate} of your recorded income toward savings and investments. Consistent progress matters. If increasing your allocation is one of your goals, consider doing so gradually when your circumstances allow.`,
        comparison: comparisonLine(calc, currency),
      };
    case "overview":
      return {
        id: "allocation-status",
        tone: "observation",
        title: "Allocation overview",
        explanation: `You've currently allocated ${rate} of your recorded income toward savings and investments. If increasing your allocation is one of your goals, consider doing so gradually when your circumstances allow.`,
        comparison: comparisonLine(calc, currency),
      };
  }
}

export function getAllocationInsight(input: AllocationInput): AllocationInsightResult {
  if (input.income <= 0) {
    return {
      status: "no-income",
      message: "Add income records to start tracking your savings and investment allocation.",
    };
  }

  const totalAllocated = input.savings + input.investment;
  if (totalAllocated <= 0) {
    return {
      status: "no-allocation",
      income: input.income,
      message: "You haven't recorded any savings or investment allocation for this period.",
    };
  }

  const calculation = computeAllocation(input);
  return { status: "calculated", calculation, insight: buildInsightCopy(calculation, input.currency) };
}
