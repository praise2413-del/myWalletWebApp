import { differenceInCalendarDays, format, isToday, isYesterday } from "date-fns";
import { getReportPeriodLabel } from "@/features/reports/lib/reportPeriod";

export function relativeNotificationTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";

  const days = differenceInCalendarDays(new Date(), date);
  if (days >= 2 && days < 30) return `${days} days ago`;
  return format(date, "MMM d, yyyy");
}

/**
 * The exact "August 31 – September 6, 2026" range text for a weekly report
 * notification — reuses the same custom-range formatter the Reports page
 * itself uses, so a notification's date range always reads identically to
 * the report it links to.
 */
export function weeklyReportPeriodLabel(periodStart: string, periodEnd: string): string {
  const start = new Date(`${periodStart}T00:00:00`);
  const end = new Date(`${periodEnd}T00:00:00`);
  const { title } = getReportPeriodLabel(
    "custom",
    { start, end, previousStart: start, previousEnd: end, bucket: "day" },
    { start, end },
  );
  return title;
}
