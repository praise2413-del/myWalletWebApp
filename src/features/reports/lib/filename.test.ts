import { describe, expect, it } from "vitest";
import { buildReportFilename } from "@/features/reports/lib/filename";
import { getReportPeriodRange } from "@/lib/utils/period";

describe("buildReportFilename", () => {
  it("sanitizes a weekly slug (which contains spaces via 'Week of') into dashes", () => {
    const reference = new Date("2026-09-03T00:00:00");
    const range = getReportPeriodRange("weekly", reference);
    const filename = buildReportFilename("weekly", range);
    expect(filename.startsWith("myWallet-Financial-Report-Week-of-")).toBe(true);
    expect(filename.endsWith(".pdf")).toBe(true);
    expect(filename).not.toMatch(/\s/);
  });

  it("builds a custom-range filename with both dates", () => {
    const customRange = { start: new Date("2026-09-01T00:00:00"), end: new Date("2026-09-30T00:00:00") };
    const range = getReportPeriodRange("custom", new Date(), customRange);
    expect(buildReportFilename("custom", range, customRange)).toBe(
      "myWallet-Financial-Report-2026-09-01-to-2026-09-30.pdf",
    );
  });

  it("builds a yearly filename", () => {
    const range = getReportPeriodRange("yearly", new Date("2026-06-01T00:00:00"));
    expect(buildReportFilename("yearly", range)).toBe("myWallet-Financial-Report-2026.pdf");
  });
});
