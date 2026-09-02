import { describe, expect, it } from "vitest";
import { generateDescriptiveInsights } from "@/lib/insights/descriptive";

const base = { income: 0, expenses: 0, netCashFlow: 0, topCategory: null, currency: "TZS", periodLabel: "this month" };

describe("generateDescriptiveInsights", () => {
  it("produces the four core facts from the spec example", () => {
    const insights = generateDescriptiveInsights({
      ...base,
      income: 1_000_000,
      expenses: 720_000,
      netCashFlow: 280_000,
      topCategory: { name: "Food", amount: 300_000 },
    });

    expect(insights.find((i) => i.id === "descriptive-total-spent")?.explanation).toContain("720,000");
    expect(insights.find((i) => i.id === "descriptive-top-category")?.title).toContain("Food");
    expect(insights.find((i) => i.id === "descriptive-income")?.explanation).toContain("1,000,000");
    expect(insights.find((i) => i.id === "descriptive-net-cash-flow")?.explanation).toContain("280,000");
  });

  it("flags negative net cash flow as attention, without shaming language", () => {
    const insights = generateDescriptiveInsights({ ...base, income: 100, expenses: 500, netCashFlow: -400 });
    const netInsight = insights.find((i) => i.id === "descriptive-net-cash-flow");
    expect(netInsight?.tone).toBe("attention");
    const text = `${netInsight?.title} ${netInsight?.explanation}`.toLowerCase();
    for (const word of ["bad", "poor", "irresponsible", "wasting", "should"]) {
      expect(text).not.toContain(word);
    }
  });

  it("marks positive net cash flow as positive", () => {
    const insights = generateDescriptiveInsights({ ...base, income: 500, expenses: 100, netCashFlow: 400 });
    expect(insights.find((i) => i.id === "descriptive-net-cash-flow")?.tone).toBe("positive");
  });

  it("never invents a category or amount when there's no data", () => {
    const insights = generateDescriptiveInsights(base);
    expect(insights).toHaveLength(0);
  });

  it("omits the category insight when there's no expense data", () => {
    const insights = generateDescriptiveInsights({ ...base, income: 500, netCashFlow: 500 });
    expect(insights.some((i) => i.id === "descriptive-top-category")).toBe(false);
  });
});
