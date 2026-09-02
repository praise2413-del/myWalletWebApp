import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";

export type DashboardPeriod = "This Week" | "This Month" | "This Year";

export interface PeriodRange {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  /** How to bucket a trend chart for this period. */
  bucket: "day" | "month";
}

export function getPeriodRange(period: DashboardPeriod, reference: Date = new Date()): PeriodRange {
  switch (period) {
    case "This Week": {
      const start = startOfWeek(reference, { weekStartsOn: 1 });
      const end = endOfWeek(reference, { weekStartsOn: 1 });
      return { start, end, previousStart: subWeeks(start, 1), previousEnd: subWeeks(end, 1), bucket: "day" };
    }
    case "This Year": {
      const start = startOfYear(reference);
      const end = endOfYear(reference);
      return { start, end, previousStart: subYears(start, 1), previousEnd: subYears(end, 1), bucket: "month" };
    }
    case "This Month":
    default: {
      const start = startOfMonth(reference);
      const end = endOfMonth(reference);
      const previousStart = subMonths(start, 1);
      // Not `subMonths(end, 1)`: that preserves day-of-month (e.g. Sep 30 -> Aug 30),
      // which is wrong whenever the previous month is longer than the current one.
      return { start, end, previousStart, previousEnd: endOfMonth(previousStart), bucket: "day" };
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
