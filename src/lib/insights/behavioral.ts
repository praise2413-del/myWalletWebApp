import { addDays, differenceInCalendarDays } from "date-fns";
import { formatCurrency } from "@/lib/utils/currency";
import { toDateKey } from "@/lib/utils/period";
import type { Insight } from "@/types";

export interface MonthlySpendingSnapshot {
  /** 'yyyy-MM' */
  monthKey: string;
  totalExpenses: number;
  topCategory: string | null;
  /** Day-of-month (1-31) of the highest single spending day that month, if any expenses were recorded. */
  highestSpendingDayOfMonth: number | null;
}

export interface DailyExpense {
  /** 'yyyy-MM-dd' */
  date: string;
  amount: number;
}

/**
 * Level 3 (behavioral) insights: patterns that only mean something with
 * enough history behind them. Every function here has its own minimum-data
 * guard and returns null rather than guessing from a couple of records.
 */

const MIN_STREAK_MONTHS = 3;

export function categoryStreakInsight(history: MonthlySpendingSnapshot[]): Insight | null {
  if (history.length < MIN_STREAK_MONTHS) return null;

  const currentCategory = history[history.length - 1].topCategory;
  if (!currentCategory) return null;

  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].topCategory === currentCategory) streak++;
    else break;
  }
  if (streak < MIN_STREAK_MONTHS) return null;

  return {
    id: "behavioral-category-streak",
    tone: "observation",
    title: `${currentCategory} has been your largest expense category`,
    explanation: `${currentCategory} has been your largest expense category for ${streak} consecutive months.`,
  };
}

export function consecutiveSpendingIncreaseInsight(history: MonthlySpendingSnapshot[]): Insight | null {
  if (history.length < MIN_STREAK_MONTHS) return null;

  let run = 1;
  for (let i = history.length - 1; i > 0; i--) {
    if (history[i].totalExpenses > history[i - 1].totalExpenses) run++;
    else break;
  }
  if (run < MIN_STREAK_MONTHS) return null;

  return {
    id: "behavioral-spending-increase-streak",
    tone: "attention",
    title: "Your spending has increased for several consecutive months",
    explanation: `Your monthly spending has increased for ${run} consecutive months.`,
  };
}

const MIN_DAYS_FOR_WEEKEND_ANALYSIS = 14;
/** Ignore a weekend/weekday gap smaller than this fraction of the higher average — not a real pattern. */
const MIN_MEANINGFUL_GAP_RATIO = 0.15;

export function weekendVsWeekdayInsight(
  dailyExpenses: DailyExpense[],
  rangeStart: Date,
  rangeEnd: Date,
  currency: string,
): Insight | null {
  const totalDays = differenceInCalendarDays(rangeEnd, rangeStart) + 1;
  if (totalDays < MIN_DAYS_FOR_WEEKEND_ANALYSIS) return null;

  const expenseByDate = new Map(dailyExpenses.map((d) => [d.date, d.amount]));
  let weekdayTotal = 0;
  let weekdayCount = 0;
  let weekendTotal = 0;
  let weekendCount = 0;

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(rangeStart, i);
    const dayOfWeek = date.getDay();
    const amount = expenseByDate.get(toDateKey(date)) ?? 0;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendTotal += amount;
      weekendCount++;
    } else {
      weekdayTotal += amount;
      weekdayCount++;
    }
  }

  if (weekendCount === 0 || weekdayCount === 0) return null;

  const weekendAvg = weekendTotal / weekendCount;
  const weekdayAvg = weekdayTotal / weekdayCount;
  const higherAvg = Math.max(weekendAvg, weekdayAvg);
  if (higherAvg === 0) return null;
  if (Math.abs(weekendAvg - weekdayAvg) < higherAvg * MIN_MEANINGFUL_GAP_RATIO) return null;

  const weekendIsHigher = weekendAvg > weekdayAvg;

  return {
    id: "behavioral-weekend-vs-weekday",
    tone: "observation",
    title: weekendIsHigher
      ? "Weekend spending is higher than weekday spending"
      : "Weekday spending is higher than weekend spending",
    explanation: `On average you spend ${formatCurrency(weekendIsHigher ? weekendAvg : weekdayAvg, currency)} per ${weekendIsHigher ? "weekend" : "weekday"} day, compared with ${formatCurrency(weekendIsHigher ? weekdayAvg : weekendAvg, currency)} per ${weekendIsHigher ? "weekday" : "weekend"} day.`,
  };
}

const MIN_MONTHS_FOR_EARLY_MONTH_PATTERN = 3;
const EARLY_MONTH_DAY_THRESHOLD = 10;
const EARLY_MONTH_MAJORITY_RATIO = 0.6;

export function earlyMonthSpendingInsight(history: MonthlySpendingSnapshot[]): Insight | null {
  const withHighDay = history.filter((h) => h.highestSpendingDayOfMonth !== null);
  if (withHighDay.length < MIN_MONTHS_FOR_EARLY_MONTH_PATTERN) return null;

  const earlyCount = withHighDay.filter(
    (h) => (h.highestSpendingDayOfMonth as number) <= EARLY_MONTH_DAY_THRESHOLD,
  ).length;
  if (earlyCount / withHighDay.length < EARLY_MONTH_MAJORITY_RATIO) return null;

  return {
    id: "behavioral-early-month-spending",
    tone: "observation",
    title: "Your highest spending days tend to occur early in the month",
    explanation: `In ${earlyCount} of the last ${withHighDay.length} months, your highest single spending day fell within the first ${EARLY_MONTH_DAY_THRESHOLD} days of the month.`,
  };
}
