import { describe, expect, it } from "vitest";
import {
  buildBalanceSheet,
  buildCashFlowStatement,
  buildIncomeStatement,
  buildTrialBalance,
  type RawLedgerLine,
} from "@/features/business/lib/statements";
import type { AccountType } from "@/types";

type AccountFixture = { accountId: string; accountCode: string; accountName: string; accountType: AccountType; accountSubtype: string };

const CASH: AccountFixture = { accountId: "cash", accountCode: "1000", accountName: "Cash", accountType: "ASSET", accountSubtype: "Current Asset" };
const BANK: AccountFixture = { accountId: "bank", accountCode: "1010", accountName: "Bank", accountType: "ASSET", accountSubtype: "Current Asset" };
const AR: AccountFixture = { accountId: "ar", accountCode: "1200", accountName: "Accounts Receivable", accountType: "ASSET", accountSubtype: "Current Asset" };
const EQUIPMENT: AccountFixture = { accountId: "equip", accountCode: "1500", accountName: "Equipment", accountType: "ASSET", accountSubtype: "Non-current Asset" };
const AP: AccountFixture = { accountId: "ap", accountCode: "2000", accountName: "Accounts Payable", accountType: "LIABILITY", accountSubtype: "Current Liability" };
const LOAN: AccountFixture = { accountId: "loan", accountCode: "2100", accountName: "Loans", accountType: "LIABILITY", accountSubtype: "Non-current Liability" };
const CAPITAL: AccountFixture = { accountId: "capital", accountCode: "3000", accountName: "Owner's Capital", accountType: "EQUITY", accountSubtype: "" };
const DRAWINGS: AccountFixture = { accountId: "drawings", accountCode: "3200", accountName: "Owner's Drawings", accountType: "EQUITY", accountSubtype: "" };
const SALES: AccountFixture = { accountId: "sales", accountCode: "4000", accountName: "Product Sales", accountType: "REVENUE", accountSubtype: "" };
const RENT: AccountFixture = { accountId: "rent", accountCode: "5000", accountName: "Rent", accountType: "EXPENSE", accountSubtype: "Operating Expense" };

function line(account: AccountFixture, entryId: string, entryDate: string, debit: number, credit: number): RawLedgerLine {
  return { ...account, entryId, entryDate, debit, credit };
}

describe("buildTrialBalance", () => {
  it("nets each account and always keeps total debit equal to total credit", () => {
    const lines: RawLedgerLine[] = [
      line(CASH, "e1", "2026-09-05", 500_000, 0),
      line(SALES, "e1", "2026-09-05", 0, 500_000),
      line(RENT, "e2", "2026-09-06", 150_000, 0),
      line(CASH, "e2", "2026-09-06", 0, 150_000),
    ];

    const tb = buildTrialBalance(lines);
    expect(tb.totalDebit).toBe(tb.totalCredit);
    expect(tb.totalDebit).toBe(500_000);

    const cashRow = tb.rows.find((r) => r.code === "1000")!;
    expect(cashRow.debit).toBe(350_000);
    expect(cashRow.credit).toBe(0);

    const salesRow = tb.rows.find((r) => r.code === "4000")!;
    expect(salesRow.debit).toBe(0);
    expect(salesRow.credit).toBe(500_000);
  });

  it("respects an as-of date, excluding later entries", () => {
    const lines: RawLedgerLine[] = [
      line(CASH, "e1", "2026-09-05", 500_000, 0),
      line(SALES, "e1", "2026-09-05", 0, 500_000),
      line(CASH, "e2", "2026-09-20", 100_000, 0),
      line(SALES, "e2", "2026-09-20", 0, 100_000),
    ];

    const tb = buildTrialBalance(lines, "2026-09-10");
    expect(tb.totalDebit).toBe(500_000);
  });
});

describe("buildIncomeStatement", () => {
  it("computes revenue, expense, and net profit only for lines in range", () => {
    const lines: RawLedgerLine[] = [
      line(CASH, "e1", "2026-09-05", 500_000, 0),
      line(SALES, "e1", "2026-09-05", 0, 500_000),
      line(RENT, "e2", "2026-09-06", 150_000, 0),
      line(CASH, "e2", "2026-09-06", 0, 150_000),
      // Outside the period — must not affect totals.
      line(CASH, "e3", "2026-08-01", 999_999, 0),
      line(SALES, "e3", "2026-08-01", 0, 999_999),
    ];

    const stmt = buildIncomeStatement(lines, "2026-09-01", "2026-09-30");
    expect(stmt.totalRevenue).toBe(500_000);
    expect(stmt.totalExpense).toBe(150_000);
    expect(stmt.netProfit).toBe(350_000);
  });
});

describe("buildBalanceSheet", () => {
  it("balances: Assets = Liabilities + Equity + Net Income To Date", () => {
    const lines: RawLedgerLine[] = [
      // Owner injects capital
      line(CASH, "e1", "2026-09-01", 1_000_000, 0),
      line(CAPITAL, "e1", "2026-09-01", 0, 1_000_000),
      // Cash sale
      line(CASH, "e2", "2026-09-05", 500_000, 0),
      line(SALES, "e2", "2026-09-05", 0, 500_000),
      // Rent paid
      line(RENT, "e3", "2026-09-06", 150_000, 0),
      line(CASH, "e3", "2026-09-06", 0, 150_000),
      // Owner draws cash out
      line(DRAWINGS, "e4", "2026-09-10", 50_000, 0),
      line(CASH, "e4", "2026-09-10", 0, 50_000),
    ];

    const bs = buildBalanceSheet(lines, "2026-09-30");
    expect(bs.isBalanced).toBe(true);
    expect(bs.totalAssets).toBe(bs.totalLiabilities + bs.totalEquity);
    expect(bs.totalAssets).toBe(1_300_000); // 1,000,000 + 500,000 - 150,000 - 50,000
    expect(bs.netIncomeToDate).toBe(350_000); // 500,000 - 150,000
  });

  it("still balances at an arbitrary as-of date mid-stream", () => {
    const lines: RawLedgerLine[] = [
      line(CASH, "e1", "2026-09-01", 1_000_000, 0),
      line(CAPITAL, "e1", "2026-09-01", 0, 1_000_000),
      line(CASH, "e2", "2026-09-05", 500_000, 0),
      line(SALES, "e2", "2026-09-05", 0, 500_000),
    ];

    const bs = buildBalanceSheet(lines, "2026-09-03"); // before e2
    expect(bs.isBalanced).toBe(true);
    expect(bs.totalAssets).toBe(1_000_000);
    expect(bs.netIncomeToDate).toBe(0);
  });
});

describe("buildCashFlowStatement", () => {
  it("classifies revenue/expense contras as operating", () => {
    const lines: RawLedgerLine[] = [
      line(CASH, "e1", "2026-09-05", 500_000, 0),
      line(SALES, "e1", "2026-09-05", 0, 500_000),
      line(RENT, "e2", "2026-09-06", 150_000, 0),
      line(CASH, "e2", "2026-09-06", 0, 150_000),
    ];

    const cf = buildCashFlowStatement(lines, "2026-09-01", "2026-09-30");
    expect(cf.operating).toBe(350_000);
    expect(cf.investing).toBe(0);
    expect(cf.financing).toBe(0);
  });

  it("classifies a non-current asset purchase as investing", () => {
    const lines: RawLedgerLine[] = [
      line(EQUIPMENT, "e1", "2026-09-05", 200_000, 0),
      line(CASH, "e1", "2026-09-05", 0, 200_000),
    ];

    const cf = buildCashFlowStatement(lines, "2026-09-01", "2026-09-30");
    expect(cf.investing).toBe(-200_000);
    expect(cf.operating).toBe(0);
  });

  it("classifies owner capital and a loan as financing", () => {
    const lines: RawLedgerLine[] = [
      line(CASH, "e1", "2026-09-01", 1_000_000, 0),
      line(CAPITAL, "e1", "2026-09-01", 0, 1_000_000),
      line(CASH, "e2", "2026-09-02", 300_000, 0),
      line(LOAN, "e2", "2026-09-02", 0, 300_000),
    ];

    const cf = buildCashFlowStatement(lines, "2026-09-01", "2026-09-30");
    expect(cf.financing).toBe(1_300_000);
  });

  it("classifies AR/AP (current) contras as operating", () => {
    const lines: RawLedgerLine[] = [
      // Collected a receivable
      line(CASH, "e1", "2026-09-05", 100_000, 0),
      line(AR, "e1", "2026-09-05", 0, 100_000),
      // Paid a payable
      line(AP, "e2", "2026-09-06", 40_000, 0),
      line(CASH, "e2", "2026-09-06", 0, 40_000),
    ];

    const cf = buildCashFlowStatement(lines, "2026-09-01", "2026-09-30");
    expect(cf.operating).toBe(60_000);
  });

  it("ignores a Cash<->Bank transfer (nets to zero across the combined cash position)", () => {
    const lines: RawLedgerLine[] = [line(BANK, "e1", "2026-09-05", 100_000, 0), line(CASH, "e1", "2026-09-05", 0, 100_000)];

    const cf = buildCashFlowStatement(lines, "2026-09-01", "2026-09-30");
    expect(cf.operating).toBe(0);
    expect(cf.investing).toBe(0);
    expect(cf.financing).toBe(0);
  });

  it("reconciles opening + net change from activities to the actual closing balance", () => {
    const lines: RawLedgerLine[] = [
      line(CASH, "e0", "2026-08-15", 200_000, 0),
      line(CAPITAL, "e0", "2026-08-15", 0, 200_000),
      line(CASH, "e1", "2026-09-05", 500_000, 0),
      line(SALES, "e1", "2026-09-05", 0, 500_000),
      line(RENT, "e2", "2026-09-06", 150_000, 0),
      line(CASH, "e2", "2026-09-06", 0, 150_000),
    ];

    const cf = buildCashFlowStatement(lines, "2026-09-01", "2026-09-30");
    expect(cf.openingCash).toBe(200_000);
    expect(cf.closingCash).toBe(550_000);
    expect(cf.isReconciled).toBe(true);
    expect(cf.netChangeFromActivities).toBe(cf.actualNetChange);
  });
});
