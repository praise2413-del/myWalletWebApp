import { describe, expect, it } from "vitest";
import { buildForecast, buildMonthlyHistory, type MonthlyTotal } from "@/features/business/lib/forecast";
import type { RawLedgerLine } from "@/features/business/lib/statements";
import type { AccountType } from "@/types";

type AccountFixture = { accountId: string; accountCode: string; accountName: string; accountType: AccountType; accountSubtype: string };

const CASH: AccountFixture = { accountId: "cash", accountCode: "1000", accountName: "Cash", accountType: "ASSET", accountSubtype: "Current Asset" };
const SALES: AccountFixture = { accountId: "sales", accountCode: "4000", accountName: "Product Sales", accountType: "REVENUE", accountSubtype: "" };

function line(account: AccountFixture, entryId: string, entryDate: string, debit: number, credit: number): RawLedgerLine {
  return { ...account, entryId, entryDate, debit, credit };
}

function month(monthKey: string, revenue: number, expenses: number): MonthlyTotal {
  return { monthKey, monthLabel: monthKey, revenue, expenses, netProfit: revenue - expenses };
}

describe("buildMonthlyHistory", () => {
  it("excludes the current in-progress month and reads only fully completed prior months", () => {
    const lines: RawLedgerLine[] = [
      // July (completed)
      line(CASH, "e1", "2026-07-05", 100_000, 0),
      line(SALES, "e1", "2026-07-05", 0, 100_000),
      // August (completed)
      line(CASH, "e2", "2026-08-05", 200_000, 0),
      line(SALES, "e2", "2026-08-05", 0, 200_000),
      // September (in progress — "today" is 2026-09-10)
      line(CASH, "e3", "2026-09-05", 999_999, 0),
      line(SALES, "e3", "2026-09-05", 0, 999_999),
    ];

    const history = buildMonthlyHistory(lines, 2, "2026-09-10");
    expect(history.map((h) => h.monthKey)).toEqual(["2026-07", "2026-08"]);
    expect(history[0].revenue).toBe(100_000);
    expect(history[1].revenue).toBe(200_000);
  });
});

describe("buildForecast", () => {
  it("returns null when there is no history at all", () => {
    expect(buildForecast([month("2026-07", 0, 0), month("2026-08", 0, 0)])).toBeNull();
  });

  it("averages available months for the projection", () => {
    const forecast = buildForecast([month("2026-07", 100_000, 40_000), month("2026-08", 200_000, 60_000)]);
    expect(forecast).not.toBeNull();
    expect(forecast!.projectedRevenue).toBe(150_000);
    expect(forecast!.projectedExpenses).toBe(50_000);
    expect(forecast!.projectedNetProfit).toBe(100_000);
    expect(forecast!.monthsUsed).toBe(2);
  });

  it("flags an upward trend when net profit is clearly rising", () => {
    const forecast = buildForecast([month("2026-06", 100_000, 90_000), month("2026-07", 100_000, 70_000), month("2026-08", 100_000, 40_000)]);
    expect(forecast!.trend).toBe("up");
  });

  it("flags a downward trend when net profit is clearly falling", () => {
    const forecast = buildForecast([month("2026-06", 100_000, 10_000), month("2026-07", 100_000, 40_000), month("2026-08", 100_000, 80_000)]);
    expect(forecast!.trend).toBe("down");
  });

  it("flags flat when net profit is roughly stable", () => {
    const forecast = buildForecast([month("2026-07", 100_000, 50_000), month("2026-08", 100_000, 51_000)]);
    expect(forecast!.trend).toBe("flat");
  });
});
