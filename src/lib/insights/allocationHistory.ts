import { formatPercent } from "@/lib/utils/currency";
import type { Insight } from "@/types";

export interface AllocationHistoryPoint {
  /** e.g. "August 2026" — a human-readable label for the period. */
  label: string;
  rate: number;
}

/**
 * Behavioral insights over time. Every function here requires a minimum
 * amount of history before producing anything — never draw a pattern from
 * one or two data points.
 */

export function consecutiveIncreaseInsight(history: AllocationHistoryPoint[]): Insight | null {
  const MIN_RUN = 3;
  if (history.length < MIN_RUN) return null;

  let run = 1;
  for (let i = history.length - 1; i > 0; i--) {
    if (history[i].rate > history[i - 1].rate) run++;
    else break;
  }
  if (run < MIN_RUN) return null;

  return {
    id: "allocation-consecutive-increase",
    tone: "positive",
    title: "Your allocation is trending up",
    explanation: `Your savings and investment allocation rate has increased for ${run} consecutive periods.`,
  };
}

export function averageRateInsight(history: AllocationHistoryPoint[], windowSize = 6): Insight | null {
  if (history.length < windowSize) return null;

  const recent = history.slice(-windowSize);
  const average = recent.reduce((sum, point) => sum + point.rate, 0) / recent.length;
  const rounded = Math.round(average * 10) / 10;

  return {
    id: "allocation-average-rate",
    tone: "observation",
    title: `Average allocation over the last ${windowSize} periods`,
    explanation: `Your average savings and investment allocation rate over the last ${windowSize} periods is ${formatPercent(rounded, 1)}.`,
  };
}

export function targetHitCountInsight(
  history: AllocationHistoryPoint[],
  target: number,
  windowSize = 5,
): Insight | null {
  if (history.length < windowSize) return null;

  const recent = history.slice(-windowSize);
  const hits = recent.filter((point) => point.rate >= target).length;
  if (hits === 0) return null;

  return {
    id: "allocation-target-hit-count",
    tone: "positive",
    title: "Target achievement",
    explanation: `You reached or exceeded your ${formatPercent(target, 0)} allocation target in ${hits} of the last ${windowSize} periods.`,
  };
}
