import { describe, expect, it } from "vitest";
import { applyScenario } from "@/features/business/lib/scenario";

describe("applyScenario", () => {
  it("applies percent changes to revenue and expenses independently", () => {
    const result = applyScenario({ baselineRevenue: 1_000_000, baselineExpenses: 600_000, revenueChangePercent: 10, expenseChangePercent: -5 });
    expect(result.revenue).toBeCloseTo(1_100_000, 5);
    expect(result.expenses).toBeCloseTo(570_000, 5);
    expect(result.netProfit).toBeCloseTo(530_000, 5);
  });

  it("computes net profit change relative to the baseline", () => {
    const result = applyScenario({ baselineRevenue: 1_000_000, baselineExpenses: 600_000, revenueChangePercent: 0, expenseChangePercent: 0 });
    expect(result.netProfitChange).toBe(0);

    const worse = applyScenario({ baselineRevenue: 1_000_000, baselineExpenses: 600_000, revenueChangePercent: -10, expenseChangePercent: 0 });
    expect(worse.netProfitChange).toBeCloseTo(-100_000, 5);
  });

  it("returns null margin when revenue is zero", () => {
    const result = applyScenario({ baselineRevenue: 0, baselineExpenses: 100, revenueChangePercent: 0, expenseChangePercent: 0 });
    expect(result.netProfitMargin).toBeNull();
  });
});
