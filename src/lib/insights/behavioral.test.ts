import { describe, expect, it } from "vitest";
import {
  categoryStreakInsight,
  consecutiveSpendingIncreaseInsight,
  earlyMonthSpendingInsight,
  weekendVsWeekdayInsight,
  type MonthlySpendingSnapshot,
} from "@/lib/insights/behavioral";

function snapshot(
  monthKey: string,
  totalExpenses: number,
  topCategory: string | null,
  highestSpendingDayOfMonth: number | null = null,
): MonthlySpendingSnapshot {
  return { monthKey, totalExpenses, topCategory, highestSpendingDayOfMonth };
}

describe("categoryStreakInsight", () => {
  it("requires at least 3 consecutive months of the same top category", () => {
    const history = [snapshot("2026-06", 100, "Food"), snapshot("2026-07", 100, "Food")];
    expect(categoryStreakInsight(history)).toBeNull();
  });

  it("detects a genuine streak and reports its real length", () => {
    const history = [
      snapshot("2026-05", 100, "Transport"),
      snapshot("2026-06", 100, "Food"),
      snapshot("2026-07", 100, "Food"),
      snapshot("2026-08", 100, "Food"),
    ];
    const insight = categoryStreakInsight(history);
    expect(insight?.explanation).toContain("Food");
    expect(insight?.explanation).toContain("3 consecutive months");
  });

  it("returns null when the most recent month has no top category", () => {
    const history = [snapshot("2026-06", 0, null), snapshot("2026-07", 0, null), snapshot("2026-08", 0, null)];
    expect(categoryStreakInsight(history)).toBeNull();
  });
});

describe("consecutiveSpendingIncreaseInsight", () => {
  it("requires at least 3 consecutive increasing months", () => {
    const history = [snapshot("2026-07", 100, "Food"), snapshot("2026-08", 120, "Food")];
    expect(consecutiveSpendingIncreaseInsight(history)).toBeNull();
  });

  it("detects a genuine increasing streak", () => {
    const history = [
      snapshot("2026-05", 80, "Food"),
      snapshot("2026-06", 100, "Food"),
      snapshot("2026-07", 130, "Food"),
      snapshot("2026-08", 160, "Food"),
    ];
    const insight = consecutiveSpendingIncreaseInsight(history);
    expect(insight?.tone).toBe("attention");
    expect(insight?.explanation).toContain("4 consecutive months");
  });

  it("stops counting the streak once spending drops", () => {
    const history = [
      snapshot("2026-05", 200, "Food"),
      snapshot("2026-06", 100, "Food"),
      snapshot("2026-07", 130, "Food"),
      snapshot("2026-08", 160, "Food"),
    ];
    // Only 06->07->08 increase (2-step run of 3 months); 05 breaks it further back.
    const insight = consecutiveSpendingIncreaseInsight(history);
    expect(insight?.explanation).toContain("3 consecutive months");
  });
});

describe("weekendVsWeekdayInsight", () => {
  const currency = "TZS";

  it("requires at least 14 days of range", () => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2026, 0, 10);
    expect(weekendVsWeekdayInsight([], start, end, currency)).toBeNull();
  });

  it("detects meaningfully higher weekend spending", () => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2026, 0, 21); // 3 weeks
    const dailyExpenses: { date: string; amount: number }[] = [];
    for (let i = 0; i <= 20; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const key = d.toISOString().slice(0, 10);
      dailyExpenses.push({ date: key, amount: isWeekend ? 50_000 : 10_000 });
    }
    const insight = weekendVsWeekdayInsight(dailyExpenses, start, end, currency);
    expect(insight?.title).toContain("Weekend spending is higher");
  });

  it("returns null when weekday and weekend spending are essentially the same", () => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2026, 0, 21);
    const dailyExpenses: { date: string; amount: number }[] = [];
    for (let i = 0; i <= 20; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyExpenses.push({ date: key, amount: 20_000 });
    }
    expect(weekendVsWeekdayInsight(dailyExpenses, start, end, currency)).toBeNull();
  });
});

describe("earlyMonthSpendingInsight", () => {
  it("requires at least 3 months with a known highest-spending day", () => {
    const history = [snapshot("2026-07", 100, "Food", 3), snapshot("2026-08", 100, "Food", 5)];
    expect(earlyMonthSpendingInsight(history)).toBeNull();
  });

  it("detects a genuine early-month clustering", () => {
    const history = [
      snapshot("2026-05", 100, "Food", 2),
      snapshot("2026-06", 100, "Food", 4),
      snapshot("2026-07", 100, "Food", 1),
      snapshot("2026-08", 100, "Food", 6),
    ];
    const insight = earlyMonthSpendingInsight(history);
    expect(insight?.explanation).toContain("4 of the last 4 months");
  });

  it("does not claim a pattern when high-spend days are scattered throughout the month", () => {
    const history = [
      snapshot("2026-05", 100, "Food", 28),
      snapshot("2026-06", 100, "Food", 3),
      snapshot("2026-07", 100, "Food", 15),
      snapshot("2026-08", 100, "Food", 22),
    ];
    expect(earlyMonthSpendingInsight(history)).toBeNull();
  });
});
