import { describe, expect, it } from "vitest";
import { getReportPeriodLabel } from "@/features/reports/lib/reportPeriod";
import { getReportPeriodRange } from "@/lib/utils/period";

describe("getReportPeriodLabel", () => {
  it("labels a daily report by its exact date", () => {
    const reference = new Date("2026-09-03T12:00:00");
    const range = getReportPeriodRange("daily", reference);
    const label = getReportPeriodLabel("daily", range);
    expect(label.title).toBe("September 3, 2026");
    expect(label.slug).toBe("2026-09-03");
  });

  it("labels a monthly report by month and year", () => {
    const reference = new Date("2026-09-15T00:00:00");
    const range = getReportPeriodRange("monthly", reference);
    const label = getReportPeriodLabel("monthly", range);
    expect(label.title).toBe("September 2026");
    expect(label.slug).toBe("September-2026");
  });

  it("labels a yearly report by year alone", () => {
    const reference = new Date("2026-09-15T00:00:00");
    const range = getReportPeriodRange("yearly", reference);
    const label = getReportPeriodLabel("yearly", range);
    expect(label.title).toBe("2026");
    expect(label.slug).toBe("2026");
  });

  it("labels a custom range with both exact boundary dates", () => {
    const customRange = { start: new Date("2026-09-01T00:00:00"), end: new Date("2026-09-15T00:00:00") };
    const range = getReportPeriodRange("custom", new Date(), customRange);
    const label = getReportPeriodLabel("custom", range, customRange);
    expect(label.title).toBe("September 1 – September 15, 2026");
    expect(label.slug).toBe("2026-09-01-to-2026-09-15");
  });

  it("collapses a single-day custom range to one date", () => {
    const customRange = { start: new Date("2026-09-03T00:00:00"), end: new Date("2026-09-03T00:00:00") };
    const range = getReportPeriodRange("custom", new Date(), customRange);
    const label = getReportPeriodLabel("custom", range, customRange);
    expect(label.title).toBe("September 3, 2026");
  });
});
