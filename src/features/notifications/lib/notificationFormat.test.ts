import { subDays } from "date-fns";
import { describe, expect, it } from "vitest";
import { relativeNotificationTime, weeklyReportPeriodLabel } from "@/features/notifications/lib/notificationFormat";

describe("relativeNotificationTime", () => {
  it("labels today", () => {
    expect(relativeNotificationTime(new Date().toISOString())).toBe("Today");
  });

  it("labels yesterday", () => {
    expect(relativeNotificationTime(subDays(new Date(), 1).toISOString())).toBe("Yesterday");
  });

  it("labels 2-29 days ago by count", () => {
    expect(relativeNotificationTime(subDays(new Date(), 2).toISOString())).toBe("2 days ago");
    expect(relativeNotificationTime(subDays(new Date(), 8).toISOString())).toBe("8 days ago");
    expect(relativeNotificationTime(subDays(new Date(), 29).toISOString())).toBe("29 days ago");
  });

  it("falls back to an exact date at 30+ days", () => {
    const date = subDays(new Date(), 30);
    expect(relativeNotificationTime(date.toISOString())).not.toMatch(/days ago/);
  });
});

describe("weeklyReportPeriodLabel", () => {
  it("always repeats the month on both sides, even within the same month", () => {
    expect(weeklyReportPeriodLabel("2026-08-17", "2026-08-23")).toBe("August 17 – August 23, 2026");
  });

  it("spans a month boundary correctly", () => {
    expect(weeklyReportPeriodLabel("2026-08-31", "2026-09-06")).toBe("August 31 – September 6, 2026");
  });
});
