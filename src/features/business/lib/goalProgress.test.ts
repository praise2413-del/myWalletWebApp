import { describe, expect, it } from "vitest";
import { buildGoalProgress } from "@/features/business/lib/goalProgress";
import type { RawLedgerLine } from "@/features/business/lib/statements";
import type { AccountType, BusinessGoal } from "@/types";

type AccountFixture = { accountId: string; accountCode: string; accountName: string; accountType: AccountType; accountSubtype: string };

const CASH: AccountFixture = { accountId: "cash", accountCode: "1000", accountName: "Cash", accountType: "ASSET", accountSubtype: "Current Asset" };
const CAPITAL: AccountFixture = { accountId: "capital", accountCode: "3000", accountName: "Owner's Capital", accountType: "EQUITY", accountSubtype: "" };
const SALES: AccountFixture = { accountId: "sales", accountCode: "4000", accountName: "Product Sales", accountType: "REVENUE", accountSubtype: "" };
const RENT: AccountFixture = { accountId: "rent", accountCode: "5000", accountName: "Rent", accountType: "EXPENSE", accountSubtype: "Operating Expense" };

function line(account: AccountFixture, entryId: string, entryDate: string, debit: number, credit: number): RawLedgerLine {
  return { ...account, entryId, entryDate, debit, credit };
}

function goal(overrides: Partial<BusinessGoal>): BusinessGoal {
  return {
    id: "g1",
    businessId: "b1",
    name: "Test Goal",
    goalType: "REVENUE",
    targetAmount: 1_000_000,
    startDate: "2026-09-01",
    targetDate: null,
    notes: "",
    createdAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

const lines: RawLedgerLine[] = [
  line(CASH, "e1", "2026-09-01", 500_000, 0),
  line(CAPITAL, "e1", "2026-09-01", 0, 500_000),
  line(CASH, "e2", "2026-09-05", 600_000, 0),
  line(SALES, "e2", "2026-09-05", 0, 600_000),
  line(RENT, "e3", "2026-09-06", 100_000, 0),
  line(CASH, "e3", "2026-09-06", 0, 100_000),
];

describe("buildGoalProgress", () => {
  it("REVENUE goal tracks cumulative revenue since start date, capped at 100%", () => {
    const progress = buildGoalProgress(goal({ goalType: "REVENUE", targetAmount: 600_000 }), lines, "2026-09-30");
    expect(progress.currentValue).toBe(600_000);
    expect(progress.percent).toBe(100);
    expect(progress.isAchieved).toBe(true);
  });

  it("NET_PROFIT goal tracks revenue minus expenses since start date", () => {
    const progress = buildGoalProgress(goal({ goalType: "NET_PROFIT", targetAmount: 1_000_000 }), lines, "2026-09-30");
    expect(progress.currentValue).toBe(500_000); // 600,000 - 100,000
    expect(progress.percent).toBe(50);
    expect(progress.isAchieved).toBe(false);
  });

  it("CASH_RESERVE goal tracks the point-in-time cash balance, ignoring start date", () => {
    const progress = buildGoalProgress(goal({ goalType: "CASH_RESERVE", targetAmount: 1_000_000, startDate: "2026-01-01" }), lines, "2026-09-30");
    expect(progress.currentValue).toBe(1_000_000); // 500,000 + 600,000 - 100,000
    expect(progress.isAchieved).toBe(true);
  });

  it("never exceeds 100% even when far over target", () => {
    const progress = buildGoalProgress(goal({ goalType: "REVENUE", targetAmount: 1 }), lines, "2026-09-30");
    expect(progress.percent).toBe(100);
  });
});
