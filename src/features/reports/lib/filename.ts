import type { CustomDateRange, PeriodRange } from "@/lib/utils/period";
import type { ReportPeriod } from "@/types";
import { getReportPeriodLabel } from "@/features/reports/lib/reportPeriod";

/**
 * Builds a meaningful, filesystem-safe PDF filename from the report's own
 * period slug, e.g. "myWallet-Financial-Report-September-2026.pdf" or
 * "myWallet-Financial-Report-2026-09-01-to-2026-09-30.pdf".
 */
export function buildReportFilename(period: ReportPeriod, range: PeriodRange, customRange?: CustomDateRange): string {
  const { slug } = getReportPeriodLabel(period, range, customRange);
  const safeSlug = slug.replace(/[^A-Za-z0-9-]/g, "-").replace(/-+/g, "-");
  return `myWallet-Financial-Report-${safeSlug}.pdf`;
}
