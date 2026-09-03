import { describe, expect, it } from "vitest";
import type { ReportData } from "@/features/reports/hooks/useReportsData";
import type { ReportRecords } from "@/features/reports/lib/fetchReportRecords";
import { buildReportModel } from "@/features/reports/lib/reportModel";

const RANGE = {
  start: new Date("2026-09-01T00:00:00"),
  end: new Date("2026-09-30T00:00:00"),
  previousStart: new Date("2026-08-01T00:00:00"),
  previousEnd: new Date("2026-08-31T00:00:00"),
  bucket: "day" as const,
};

const EMPTY_RECORDS: ReportRecords = { incomeRecords: [], expenseRecords: [], allocationRecords: [] };

function baseReportData(overrides: Partial<ReportData["summary"]> = {}, allocation = { savings: 0, investment: 0 }): ReportData {
  const summary: ReportData["summary"] = {
    income: 0,
    expenses: 0,
    netCashFlow: 0,
    previousIncome: 0,
    previousExpenses: 0,
    previousNetCashFlow: 0,
    deltas: { income: 0, expenses: 0, netCashFlow: 0 },
    averageDailyExpense: 0,
    highestCategory: null,
    highestSpendingDay: null,
    ...overrides,
  };
  return {
    range: RANGE,
    summary,
    categoryDistribution: [],
    categoryComparison: [],
    categoryBreakdown: [],
    categoryChanges: [],
    spendingTrend: [],
    trendBucket: "day",
    allocation,
    hasAnyExpenses: summary.expenses > 0,
  };
}

describe("buildReportModel — allocation bands (spec §30 worked examples)", () => {
  it("30% exact allocation reaches the target", () => {
    const model = buildReportModel({
      period: "monthly",
      reportData: baseReportData({ income: 1_000_000, expenses: 400_000, netCashFlow: 600_000 }, { savings: 200_000, investment: 100_000 }),
      records: EMPTY_RECORDS,
      currency: "TZS",
      allocationTarget: 30,
    });

    expect(model.savingsInvestment.rate).toBe(30);
    expect(model.savingsInvestment.band).toBe("reached");
    expect(model.savingsInvestment.statusLabel).toBe("Target Reached");
  });

  it("35% allocation exceeds the target", () => {
    const model = buildReportModel({
      period: "monthly",
      reportData: baseReportData({ income: 1_000_000 }, { savings: 200_000, investment: 150_000 }),
      records: EMPTY_RECORDS,
      currency: "TZS",
      allocationTarget: 30,
    });

    expect(model.savingsInvestment.rate).toBe(35);
    expect(model.savingsInvestment.band).toBe("exceeded");
    expect(model.savingsInvestment.statusLabel).toBe("Target Exceeded");
  });

  it("25% allocation is below target with supportive progress messaging", () => {
    const model = buildReportModel({
      period: "monthly",
      reportData: baseReportData({ income: 1_000_000 }, { savings: 150_000, investment: 100_000 }),
      records: EMPTY_RECORDS,
      currency: "TZS",
      allocationTarget: 30,
    });

    expect(model.savingsInvestment.rate).toBe(25);
    expect(model.savingsInvestment.band).toBe("good-progress");
    expect(model.savingsInvestment.message.toLowerCase()).toContain("progress toward");
    expect(model.savingsInvestment.message.toLowerCase()).not.toMatch(/wast|bad|shame/);
  });
});

describe("buildReportModel — zero income / no data", () => {
  it("never produces NaN/Infinity when income is zero", () => {
    const model = buildReportModel({
      period: "monthly",
      reportData: baseReportData({ income: 0, expenses: 50_000 }, { savings: 0, investment: 0 }),
      records: EMPTY_RECORDS,
      currency: "TZS",
      allocationTarget: 30,
    });

    expect(model.savingsInvestment.rate).toBeNull();
    expect(model.summary.allocationRate).toBeNull();
    expect(model.charts.allocationVsTarget.rate).toBe(0);
    expect(Number.isFinite(model.charts.allocationVsTarget.rate)).toBe(true);
    expect(model.summary.executiveSummaryText).not.toMatch(/NaN|Infinity|undefined/);
  });

  it("marks a period with no recorded activity as empty", () => {
    const model = buildReportModel({
      period: "monthly",
      reportData: baseReportData(),
      records: EMPTY_RECORDS,
      currency: "TZS",
      allocationTarget: 30,
    });

    expect(model.isEmpty).toBe(true);
    expect(model.summary.executiveSummaryText).toMatch(/no financial activity/i);
  });
});

describe("buildReportModel — filename and title", () => {
  it("builds a period-appropriate title and filename", () => {
    const model = buildReportModel({
      period: "monthly",
      reportData: baseReportData({ income: 1_000_000, expenses: 400_000 }),
      records: EMPTY_RECORDS,
      currency: "TZS",
      allocationTarget: 30,
    });

    expect(model.periodTitle).toBe("September 2026");
    expect(model.filename).toBe("myWallet-Financial-Report-September-2026.pdf");
  });
});
