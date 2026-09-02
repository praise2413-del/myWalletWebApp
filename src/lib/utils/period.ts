import {
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import type { ReportPeriod } from "@/types";

export type DashboardPeriod = "This Week" | "This Month" | "This Year";

export interface PeriodRange {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  /** How to bucket a trend chart for this period. */
  bucket: "day" | "month";
}

function weekBounds(reference: Date) {
  return { start: startOfWeek(reference, { weekStartsOn: 1 }), end: endOfWeek(reference, { weekStartsOn: 1 }) };
}

function monthBounds(reference: Date) {
  return { start: startOfMonth(reference), end: endOfMonth(reference) };
}

function yearBounds(reference: Date) {
  return { start: startOfYear(reference), end: endOfYear(reference) };
}

/**
 * The previous calendar month's end, computed correctly regardless of
 * month length. Not `subMonths(end, 1)`: that preserves day-of-month
 * (e.g. Sep 30 -> Aug 30), which is wrong whenever the previous month
 * is longer than the current one.
 */
function previousMonthEnd(monthStart: Date): Date {
  return endOfMonth(subMonths(monthStart, 1));
}

export function getPeriodRange(period: DashboardPeriod, reference: Date = new Date()): PeriodRange {
  switch (period) {
    case "This Week": {
      const { start, end } = weekBounds(reference);
      return { start, end, previousStart: subWeeks(start, 1), previousEnd: subWeeks(end, 1), bucket: "day" };
    }
    case "This Year": {
      const { start, end } = yearBounds(reference);
      return { start, end, previousStart: subYears(start, 1), previousEnd: subYears(end, 1), bucket: "month" };
    }
    case "This Month":
    default: {
      const { start, end } = monthBounds(reference);
      const previousStart = subMonths(start, 1);
      return { start, end, previousStart, previousEnd: previousMonthEnd(start), bucket: "day" };
    }
  }
}

export interface CustomDateRange {
  start: Date;
  end: Date;
}

/**
 * Report periods add "daily" and an arbitrary "custom" range on top of
 * what the Dashboard needs. `customRange` is required (and only used)
 * when `period === "custom"`.
 */
export function getReportPeriodRange(
  period: ReportPeriod,
  reference: Date = new Date(),
  customRange?: CustomDateRange,
): PeriodRange {
  switch (period) {
    case "daily": {
      const start = startOfDay(reference);
      const end = endOfDay(reference);
      const previousDay = subDays(reference, 1);
      return { start, end, previousStart: startOfDay(previousDay), previousEnd: endOfDay(previousDay), bucket: "day" };
    }
    case "weekly": {
      const { start, end } = weekBounds(reference);
      return { start, end, previousStart: subWeeks(start, 1), previousEnd: subWeeks(end, 1), bucket: "day" };
    }
    case "yearly": {
      const { start, end } = yearBounds(reference);
      return { start, end, previousStart: subYears(start, 1), previousEnd: subYears(end, 1), bucket: "month" };
    }
    case "custom": {
      if (!customRange) {
        throw new Error("getReportPeriodRange: customRange is required when period is 'custom'");
      }
      const start = startOfDay(customRange.start);
      const end = endOfDay(customRange.end);
      const lengthDays = differenceInCalendarDays(end, start) + 1;
      const previousEnd = endOfDay(subDays(start, 1));
      const previousStart = startOfDay(subDays(previousEnd, lengthDays - 1));
      return { start, end, previousStart, previousEnd, bucket: lengthDays > 62 ? "month" : "day" };
    }
    case "monthly":
    default: {
      const { start, end } = monthBounds(reference);
      const previousStart = subMonths(start, 1);
      return { start, end, previousStart, previousEnd: previousMonthEnd(start), bucket: "day" };
    }
  }
}

/** Formats a Date as the 'YYYY-MM-DD' string Postgres `date` columns expect. */
export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}
