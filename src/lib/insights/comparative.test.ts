import { describe, expect, it } from "vitest";
import { generateComparativeInsights } from "@/lib/insights/comparative";

const base = {
  income: 0,
  previousIncome: 0,
  expenses: 0,
  previousExpenses: 0,
  categoryChanges: [],
  currency: "TZS",
};

describe("generateComparativeInsights", () => {
  it("reports a spending increase as attention with the right percentage", () => {
    const insights = generateComparativeInsights({ ...base, expenses: 115_000, previousExpenses: 100_000 });
    const insight = insights.find((i) => i.id === "comparative-total-expenses");
    expect(insight?.tone).toBe("attention");
    expect(insight?.explanation).toContain("15%");
  });

  it("reports a spending decrease as positive", () => {
    const insights = generateComparativeInsights({ ...base, expenses: 80_000, previousExpenses: 100_000 });
    const insight = insights.find((i) => i.id === "comparative-total-expenses");
    expect(insight?.tone).toBe("positive");
    expect(insight?.explanation).toContain("20%");
  });

  it("ignores a negligible change (under the noise threshold)", () => {
    const insights = generateComparativeInsights({ ...base, expenses: 101_000, previousExpenses: 100_000 });
    expect(insights.some((i) => i.id === "comparative-total-expenses")).toBe(false);
  });

  it("never compares against a previous period with no data", () => {
    const insights = generateComparativeInsights({ ...base, expenses: 100_000, previousExpenses: 0 });
    expect(insights.some((i) => i.id === "comparative-total-expenses")).toBe(false);
  });

  it("surfaces the categories that changed the most, capped at 3", () => {
    const insights = generateComparativeInsights({
      ...base,
      categoryChanges: [
        { name: "Food", amount: 200_000, previousAmount: 100_000 },
        { name: "Transport", amount: 50_000, previousAmount: 40_000 },
        { name: "Bills", amount: 70_000, previousAmount: 70_500 }, // negligible, filtered out
        { name: "Shopping", amount: 90_000, previousAmount: 30_000 },
        { name: "Health", amount: 20_000, previousAmount: 15_000 },
      ],
    });
    const categoryInsights = insights.filter((i) => i.id.startsWith("comparative-category-"));
    expect(categoryInsights.length).toBeLessThanOrEqual(3);
    expect(categoryInsights.some((i) => i.id === "comparative-category-Bills")).toBe(false);
    // Food moved the most in absolute terms (100,000) and should be included.
    expect(categoryInsights.some((i) => i.id === "comparative-category-Food")).toBe(true);
  });
});
