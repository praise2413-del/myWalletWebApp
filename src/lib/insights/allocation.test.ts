import { describe, expect, it } from "vitest";
import { calculateAllocationRate, classifyAllocation, getAllocationInsight } from "@/lib/insights/allocation";
import {
  averageRateInsight,
  consecutiveIncreaseInsight,
  targetHitCountInsight,
} from "@/lib/insights/allocationHistory";

describe("calculateAllocationRate", () => {
  it("matches the spec's core example: 300,000 / 1,000,000 = 30%", () => {
    expect(calculateAllocationRate(1_000_000, 300_000)).toBe(30);
  });

  it("handles an above-target example: 350,000 / 1,000,000 = 35%", () => {
    expect(calculateAllocationRate(1_000_000, 350_000)).toBe(35);
  });

  it("handles a below-target example: 250,000 / 1,000,000 = 25%", () => {
    expect(calculateAllocationRate(1_000_000, 250_000)).toBe(25);
  });

  it("sums multiple allocations (savings + investment) correctly: 150k + 150k / 1,000,000 = 30%", () => {
    expect(calculateAllocationRate(1_000_000, 150_000 + 150_000)).toBe(30);
  });

  it("never produces NaN or Infinity when income is zero", () => {
    const rate = calculateAllocationRate(0, 100_000);
    expect(Number.isFinite(rate)).toBe(true);
    expect(rate).toBe(0);
  });

  it("returns 0 when there is no allocation", () => {
    expect(calculateAllocationRate(1_000_000, 0)).toBe(0);
  });
});

describe("classifyAllocation", () => {
  it("classifies exactly-at-target as reached", () => {
    expect(classifyAllocation(30, 30)).toEqual({ band: "reached", tone: "positive" });
  });

  it("classifies above-target as exceeded", () => {
    expect(classifyAllocation(35, 30)).toEqual({ band: "exceeded", tone: "positive" });
  });

  it("classifies 20-29% as good-progress", () => {
    expect(classifyAllocation(25, 30)).toEqual({ band: "good-progress", tone: "observation" });
  });

  it("classifies 10-19% as building-habit", () => {
    expect(classifyAllocation(15, 30)).toEqual({ band: "building-habit", tone: "observation" });
  });

  it("classifies below 10% as overview", () => {
    expect(classifyAllocation(7, 30)).toEqual({ band: "overview", tone: "observation" });
  });

  it("respects a customized (non-30%) target", () => {
    expect(classifyAllocation(22, 20)).toEqual({ band: "exceeded", tone: "positive" });
    expect(classifyAllocation(18, 20)).toEqual({ band: "building-habit", tone: "observation" });
  });
});

describe("getAllocationInsight", () => {
  const currency = "TZS";

  it("reports no-income when income is zero, without dividing by zero", () => {
    const result = getAllocationInsight({ income: 0, savings: 0, investment: 0, target: 30, currency });
    expect(result.status).toBe("no-income");
  });

  it("reports no-allocation when there's income but nothing allocated", () => {
    const result = getAllocationInsight({ income: 1_000_000, savings: 0, investment: 0, target: 30, currency });
    expect(result).toMatchObject({ status: "no-allocation", income: 1_000_000 });
  });

  it("never shames the user for a low allocation rate", () => {
    const result = getAllocationInsight({ income: 1_000_000, savings: 70_000, investment: 0, target: 30, currency });
    expect(result.status).toBe("calculated");
    if (result.status !== "calculated") throw new Error("expected calculated");
    const forbidden = ["poor", "failure", "bad", "wasting", "irresponsible", "should invest"];
    const text = (result.insight.title + " " + result.insight.explanation).toLowerCase();
    for (const word of forbidden) {
      expect(text).not.toContain(word);
    }
  });

  it("never recommends a specific financial product", () => {
    const result = getAllocationInsight({ income: 1_000_000, savings: 350_000, investment: 0, target: 30, currency });
    expect(result.status).toBe("calculated");
    if (result.status !== "calculated") throw new Error("expected calculated");
    const text = result.insight.explanation.toLowerCase();
    for (const word of ["stock", "crypto", "bond", "mutual fund", "bank account"]) {
      expect(text).not.toContain(word);
    }
  });

  it("shows the exact numbers behind an exceeded-target insight", () => {
    const result = getAllocationInsight({ income: 1_000_000, savings: 200_000, investment: 150_000, target: 30, currency });
    expect(result.status).toBe("calculated");
    if (result.status !== "calculated") throw new Error("expected calculated");
    expect(result.calculation.rate).toBe(35);
    expect(result.calculation.band).toBe("exceeded");
    expect(result.insight.comparison).toContain("TZS 350,000");
    expect(result.insight.comparison).toContain("TZS 1,000,000");
  });
});

describe("allocation history insights (require sufficient data)", () => {
  it("does not claim a streak from fewer than 3 periods", () => {
    const history = [
      { label: "a", rate: 10 },
      { label: "b", rate: 20 },
    ];
    expect(consecutiveIncreaseInsight(history)).toBeNull();
  });

  it("detects a genuine 3-period increasing streak", () => {
    const history = [
      { label: "a", rate: 10 },
      { label: "b", rate: 15 },
      { label: "c", rate: 20 },
      { label: "d", rate: 25 },
    ];
    const insight = consecutiveIncreaseInsight(history);
    expect(insight?.explanation).toContain("4 consecutive periods");
  });

  it("does not compute a 6-period average from partial data", () => {
    const history = Array.from({ length: 4 }, (_, i) => ({ label: String(i), rate: 20 }));
    expect(averageRateInsight(history, 6)).toBeNull();
  });

  it("computes a 6-period average once enough data exists", () => {
    const history = [10, 20, 30, 40, 50, 60].map((rate, i) => ({ label: String(i), rate }));
    const insight = averageRateInsight(history, 6);
    expect(insight?.explanation).toContain("35.0%");
  });

  it("counts target hits only across a full window", () => {
    const history = [35, 10, 32, 5, 40].map((rate, i) => ({ label: String(i), rate }));
    const insight = targetHitCountInsight(history, 30, 5);
    expect(insight?.explanation).toContain("3 of the last 5");
  });
});
