import { describe, expect, it } from "vitest";
import { getPeriodRange, getReportPeriodRange, percentChange, toDateKey } from "@/lib/utils/period";

describe("getPeriodRange", () => {
  it("This Month: previousEnd is the actual last day of the prior month, not day-of-month clamped", () => {
    // September has 30 days, August has 31 — a naive subMonths(end, 1) would give Aug 30.
    const range = getPeriodRange("This Month", new Date(2026, 8, 2)); // Sep 2, 2026
    expect(toDateKey(range.previousEnd)).toBe("2026-08-31");
    expect(toDateKey(range.previousStart)).toBe("2026-08-01");
    expect(toDateKey(range.start)).toBe("2026-09-01");
    expect(toDateKey(range.end)).toBe("2026-09-30");
  });

  it("This Month: also correct going from March into February (leap year)", () => {
    const range = getPeriodRange("This Month", new Date(2028, 2, 15)); // Mar 15, 2028 (leap year)
    expect(toDateKey(range.previousEnd)).toBe("2028-02-29");
  });

  it("This Week: previous week is exactly 7 days back with no clamping issue", () => {
    const range = getPeriodRange("This Week", new Date(2026, 8, 2));
    const daysBetween = (range.start.getTime() - range.previousStart.getTime()) / 86_400_000;
    expect(daysBetween).toBe(7);
  });

  it("This Year: previous year end is Dec 31 of the prior year", () => {
    const range = getPeriodRange("This Year", new Date(2026, 8, 2));
    expect(toDateKey(range.previousEnd)).toBe("2025-12-31");
  });
});

describe("getReportPeriodRange", () => {
  it("daily: start and end are the same calendar day, previous is exactly the day before", () => {
    const range = getReportPeriodRange("daily", new Date(2026, 8, 2));
    expect(toDateKey(range.start)).toBe("2026-09-02");
    expect(toDateKey(range.end)).toBe("2026-09-02");
    expect(toDateKey(range.previousStart)).toBe("2026-09-01");
    expect(toDateKey(range.previousEnd)).toBe("2026-09-01");
    expect(range.bucket).toBe("day");
  });

  it("monthly: reuses the same month-length-safe logic as the dashboard", () => {
    const range = getReportPeriodRange("monthly", new Date(2026, 8, 2));
    expect(toDateKey(range.previousEnd)).toBe("2026-08-31");
  });

  it("yearly: buckets by month", () => {
    const range = getReportPeriodRange("yearly", new Date(2026, 8, 2));
    expect(range.bucket).toBe("month");
    expect(toDateKey(range.previousEnd)).toBe("2025-12-31");
  });

  it("custom: previous period is an equal-length window immediately before, not a fixed unit", () => {
    // A 10-day custom range (Sep 1 - Sep 10) should compare against the 10 days before it.
    const range = getReportPeriodRange("custom", new Date(), {
      start: new Date(2026, 8, 1),
      end: new Date(2026, 8, 10),
    });
    expect(toDateKey(range.start)).toBe("2026-09-01");
    expect(toDateKey(range.end)).toBe("2026-09-10");
    expect(toDateKey(range.previousStart)).toBe("2026-08-22");
    expect(toDateKey(range.previousEnd)).toBe("2026-08-31");
  });

  it("custom: a single-day range compares against exactly the day before", () => {
    const range = getReportPeriodRange("custom", new Date(), {
      start: new Date(2026, 8, 5),
      end: new Date(2026, 8, 5),
    });
    expect(toDateKey(range.previousStart)).toBe("2026-09-04");
    expect(toDateKey(range.previousEnd)).toBe("2026-09-04");
  });

  it("custom: throws a clear error if no range is given", () => {
    expect(() => getReportPeriodRange("custom")).toThrow();
  });

  it("custom: switches the trend chart to monthly buckets for long ranges", () => {
    const range = getReportPeriodRange("custom", new Date(), {
      start: new Date(2026, 0, 1),
      end: new Date(2026, 11, 31),
    });
    expect(range.bucket).toBe("month");
  });
});

describe("percentChange", () => {
  it("computes a normal percentage change", () => {
    expect(percentChange(115, 100)).toBe(15);
    expect(percentChange(80, 100)).toBe(-20);
  });

  it("treats 0 -> 0 as no change, not NaN", () => {
    expect(percentChange(0, 0)).toBe(0);
  });

  it("treats 0 -> positive as a 100% change, not Infinity", () => {
    expect(percentChange(500, 0)).toBe(100);
    expect(Number.isFinite(percentChange(500, 0))).toBe(true);
  });
});
