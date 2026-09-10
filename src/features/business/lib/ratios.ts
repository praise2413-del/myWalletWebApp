import type { BalanceSheet, IncomeStatement, RawLedgerLine } from "@/features/business/lib/statements";

/** The starter chart's Inventory account — same documented limitation as CASH_ACCOUNT_CODES (revisit once accounts are user-creatable). */
const INVENTORY_ACCOUNT_CODE = "1300";

export interface BusinessRatios {
  currentAssets: number;
  currentLiabilities: number;
  inventory: number;
  /** Current Assets / Current Liabilities. Null when there are no current liabilities (the ratio is undefined, not zero or infinite). */
  currentRatio: number | null;
  /** (Current Assets − Inventory) / Current Liabilities — the "acid test," excluding the least liquid current asset. */
  quickRatio: number | null;
  /** Current Assets − Current Liabilities, in currency. */
  workingCapital: number;
  /** Total Liabilities / Total Equity. Null when there's no equity to divide by. */
  debtToEquity: number | null;
  /** Net Profit ÷ Revenue × 100, for the selected period. Null when there's no revenue. */
  netProfitMargin: number | null;
  /** Net Profit (for the period) ÷ Total Assets (as of the period end) × 100 — a period figure over a point-in-time balance, not annualized. Null when there are no assets. */
  returnOnAssets: number | null;
}

function safeRatio(numerator: number, denominator: number): number | null {
  if (Math.abs(denominator) < 0.005) return null;
  return numerator / denominator;
}

function safePercent(numerator: number, denominator: number): number | null {
  const ratio = safeRatio(numerator, denominator);
  return ratio === null ? null : ratio * 100;
}

/** Every account with a Current Asset/Current Liability subtype, netted as of `asOfDate` — mirrors buildBalanceSheet's own grouping logic but keeps the Current/Non-current split the Balance Sheet's public shape doesn't expose. */
function currentBalances(lines: RawLedgerLine[], asOfDate: string): { currentAssets: number; currentLiabilities: number; inventory: number } {
  const upToDate = lines.filter((l) => l.entryDate <= asOfDate);

  const currentAssets = upToDate
    .filter((l) => l.accountType === "ASSET" && l.accountSubtype === "Current Asset")
    .reduce((sum, l) => sum + l.debit - l.credit, 0);
  const currentLiabilities = upToDate
    .filter((l) => l.accountType === "LIABILITY" && l.accountSubtype === "Current Liability")
    .reduce((sum, l) => sum + l.credit - l.debit, 0);
  const inventory = upToDate
    .filter((l) => l.accountCode === INVENTORY_ACCOUNT_CODE)
    .reduce((sum, l) => sum + l.debit - l.credit, 0);

  return { currentAssets, currentLiabilities, inventory };
}

export function buildBusinessRatios(
  lines: RawLedgerLine[],
  asOfDate: string,
  balanceSheet: BalanceSheet,
  incomeStatement: IncomeStatement,
): BusinessRatios {
  const { currentAssets, currentLiabilities, inventory } = currentBalances(lines, asOfDate);

  return {
    currentAssets,
    currentLiabilities,
    inventory,
    currentRatio: safeRatio(currentAssets, currentLiabilities),
    quickRatio: safeRatio(currentAssets - inventory, currentLiabilities),
    workingCapital: currentAssets - currentLiabilities,
    debtToEquity: safeRatio(balanceSheet.totalLiabilities, balanceSheet.totalEquity),
    netProfitMargin: safePercent(incomeStatement.netProfit, incomeStatement.totalRevenue),
    returnOnAssets: safePercent(incomeStatement.netProfit, balanceSheet.totalAssets),
  };
}
