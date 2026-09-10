import { describe, expect, it } from "vitest";
import { buildBusinessRatios } from "@/features/business/lib/ratios";
import { buildBalanceSheet, buildIncomeStatement, type RawLedgerLine } from "@/features/business/lib/statements";
import type { AccountType } from "@/types";

type AccountFixture = { accountId: string; accountCode: string; accountName: string; accountType: AccountType; accountSubtype: string };

const CASH: AccountFixture = { accountId: "cash", accountCode: "1000", accountName: "Cash", accountType: "ASSET", accountSubtype: "Current Asset" };
const AR: AccountFixture = { accountId: "ar", accountCode: "1200", accountName: "Accounts Receivable", accountType: "ASSET", accountSubtype: "Current Asset" };
const INVENTORY: AccountFixture = { accountId: "inv", accountCode: "1300", accountName: "Inventory", accountType: "ASSET", accountSubtype: "Current Asset" };
const EQUIPMENT: AccountFixture = { accountId: "equip", accountCode: "1500", accountName: "Equipment", accountType: "ASSET", accountSubtype: "Non-current Asset" };
const AP: AccountFixture = { accountId: "ap", accountCode: "2000", accountName: "Accounts Payable", accountType: "LIABILITY", accountSubtype: "Current Liability" };
const LOAN: AccountFixture = { accountId: "loan", accountCode: "2100", accountName: "Loans", accountType: "LIABILITY", accountSubtype: "Non-current Liability" };
const CAPITAL: AccountFixture = { accountId: "capital", accountCode: "3000", accountName: "Owner's Capital", accountType: "EQUITY", accountSubtype: "" };
const SALES: AccountFixture = { accountId: "sales", accountCode: "4000", accountName: "Product Sales", accountType: "REVENUE", accountSubtype: "" };
const RENT: AccountFixture = { accountId: "rent", accountCode: "5000", accountName: "Rent", accountType: "EXPENSE", accountSubtype: "Operating Expense" };

function line(account: AccountFixture, entryId: string, entryDate: string, debit: number, credit: number): RawLedgerLine {
  return { ...account, entryId, entryDate, debit, credit };
}

describe("buildBusinessRatios", () => {
  it("computes current/quick ratio, working capital, debt-to-equity, margins", () => {
    const lines: RawLedgerLine[] = [
      // Owner capital -> cash
      line(CASH, "e1", "2026-09-01", 1_000_000, 0),
      line(CAPITAL, "e1", "2026-09-01", 0, 1_000_000),
      // Bank loan (non-current liability) doesn't touch current ratio
      line(CASH, "e2", "2026-09-02", 400_000, 0),
      line(LOAN, "e2", "2026-09-02", 0, 400_000),
      // AR and Inventory build-up
      line(AR, "e3", "2026-09-03", 200_000, 0),
      line(SALES, "e3", "2026-09-03", 0, 200_000),
      line(INVENTORY, "e4", "2026-09-04", 300_000, 0),
      line(CASH, "e4", "2026-09-04", 0, 300_000),
      // Equipment (non-current asset) doesn't touch current ratio
      line(EQUIPMENT, "e5", "2026-09-05", 250_000, 0),
      line(CASH, "e5", "2026-09-05", 0, 250_000),
      // Accounts payable (current liability)
      line(AP, "e6", "2026-09-06", 0, 150_000),
      line(INVENTORY, "e6b", "2026-09-06", 150_000, 0),
      // Rent expense
      line(RENT, "e7", "2026-09-07", 50_000, 0),
      line(CASH, "e7", "2026-09-07", 0, 50_000),
    ];

    const asOf = "2026-09-30";
    const bs = buildBalanceSheet(lines, asOf);
    const is = buildIncomeStatement(lines, "2026-09-01", "2026-09-30");
    const ratios = buildBusinessRatios(lines, asOf, bs, is);

    // Current assets: Cash(1,000,000+400,000-300,000-250,000-50,000=800,000) + AR(200,000) + Inventory(300,000+150,000=450,000) = 1,450,000
    expect(ratios.currentAssets).toBe(1_450_000);
    expect(ratios.currentLiabilities).toBe(150_000);
    expect(ratios.currentRatio).toBeCloseTo(1_450_000 / 150_000, 5);
    expect(ratios.quickRatio).toBeCloseTo((1_450_000 - 450_000) / 150_000, 5);
    expect(ratios.workingCapital).toBe(1_450_000 - 150_000);

    // Total liabilities = AP 150,000 + Loan 400,000 = 550,000. Total equity = Capital 1,000,000 + NetIncome (200,000 - 50,000 = 150,000) = 1,150,000
    expect(bs.totalLiabilities).toBe(550_000);
    expect(ratios.debtToEquity).toBeCloseTo(550_000 / 1_150_000, 5);

    // Net profit margin = 150,000 / 200,000 * 100 = 75%
    expect(ratios.netProfitMargin).toBeCloseTo(75, 5);
  });

  it("returns null instead of dividing by zero when there are no current liabilities, no equity, or no revenue", () => {
    const lines: RawLedgerLine[] = [line(CASH, "e1", "2026-09-01", 100, 0), line(SALES, "e1", "2026-09-01", 0, 100)];
    const bs = buildBalanceSheet(lines, "2026-09-30");
    const is = buildIncomeStatement(lines, "2026-09-01", "2026-09-30");
    const ratios = buildBusinessRatios(lines, "2026-09-30", bs, is);

    expect(ratios.currentRatio).toBeNull(); // no current liabilities
    expect(ratios.quickRatio).toBeNull();

    const noRevenueLines: RawLedgerLine[] = [line(CASH, "e1", "2026-09-01", 100, 0), line(CAPITAL, "e1", "2026-09-01", 0, 100)];
    const bs2 = buildBalanceSheet(noRevenueLines, "2026-09-30");
    const is2 = buildIncomeStatement(noRevenueLines, "2026-09-01", "2026-09-30");
    const ratios2 = buildBusinessRatios(noRevenueLines, "2026-09-30", bs2, is2);
    expect(ratios2.netProfitMargin).toBeNull(); // no revenue
  });
});
