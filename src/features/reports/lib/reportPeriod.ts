import { format, isSameDay } from "date-fns";
import type { CustomDateRange, PeriodRange } from "@/lib/utils/period";
import type { ReportPeriod } from "@/types";

export interface ReportPeriodLabel {
  /** Human-readable title shown in the report header, e.g. "September 2026". */
  title: string;
  /** Filename-safe slug, e.g. "September-2026". */
  slug: string;
}

/**
 * Human title + filename slug for the selected report period, derived from
 * the same `PeriodRange` the report's data query already computed — so the
 * label can never drift from the data it's describing.
 */
export function getReportPeriodLabel(
  period: ReportPeriod,
  range: PeriodRange,
  customRange?: CustomDateRange,
): ReportPeriodLabel {
  switch (period) {
    case "daily":
      return { title: format(range.start, "MMMM d, yyyy"), slug: format(range.start, "yyyy-MM-dd") };
    case "weekly":
      return {
        title: `Week of ${format(range.start, "MMM d")} – ${format(range.end, "MMM d, yyyy")}`,
        slug: `Week-of-${format(range.start, "yyyy-MM-dd")}`,
      };
    case "yearly":
      return { title: format(range.start, "yyyy"), slug: format(range.start, "yyyy") };
    case "custom": {
      const start = customRange?.start ?? range.start;
      const end = customRange?.end ?? range.end;
      if (isSameDay(start, end)) {
        return { title: format(start, "MMMM d, yyyy"), slug: format(start, "yyyy-MM-dd") };
      }
      return {
        title: `${format(start, "MMMM d")} – ${format(end, "MMMM d, yyyy")}`,
        slug: `${format(start, "yyyy-MM-dd")}-to-${format(end, "yyyy-MM-dd")}`,
      };
    }
    case "monthly":
    default:
      return { title: format(range.start, "MMMM yyyy"), slug: format(range.start, "MMMM-yyyy") };
  }
}

const PERIOD_KIND_LABEL: Record<ReportPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  custom: "Custom",
};

export function reportPeriodKindLabel(period: ReportPeriod): string {
  return PERIOD_KIND_LABEL[period];
}
