import type { AccountType } from "@/types";

/** The starter chart of accounts' cash-like accounts (Chart of Accounts is read-only so far — revisit once custom accounts can be created). */
export const CASH_ACCOUNT_CODES = ["1000", "1010"];

export interface RawLedgerLine {
  entryId: string;
  entryDate: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  accountSubtype: string;
  debit: number;
  credit: number;
}

function isCash(line: RawLedgerLine): boolean {
  return CASH_ACCOUNT_CODES.includes(line.accountCode);
}

// ---------------------------------------------------------------------
// Trial Balance
// ---------------------------------------------------------------------

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
}

export interface TrialBalance {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
}

/**
 * A Trial Balance nets each account's own activity (debit minus credit) and
 * places a positive net in the Debit column, a negative net in the Credit
 * column — that's the definition, independent of the account's "normal"
 * side. ASSET/EXPENSE accounts land in Debit and LIABILITY/EQUITY/REVENUE
 * in Credit only because that's their usual activity, not because of any
 * special-casing here.
 */
export function buildTrialBalance(lines: RawLedgerLine[], asOfDate?: string): TrialBalance {
  const filtered = asOfDate ? lines.filter((l) => l.entryDate <= asOfDate) : lines;

  const byAccount = new Map<string, TrialBalanceRow & { net: number }>();
  for (const line of filtered) {
    const existing = byAccount.get(line.accountId);
    const net = (existing?.net ?? 0) + line.debit - line.credit;
    byAccount.set(line.accountId, {
      accountId: line.accountId,
      code: line.accountCode,
      name: line.accountName,
      type: line.accountType,
      debit: 0,
      credit: 0,
      net,
    });
  }

  const rows = [...byAccount.values()]
    .map((r) => ({
      accountId: r.accountId,
      code: r.code,
      name: r.name,
      type: r.type,
      debit: r.net > 0 ? r.net : 0,
      credit: r.net < 0 ? -r.net : 0,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  return {
    rows,
    totalDebit: rows.reduce((sum, r) => sum + r.debit, 0),
    totalCredit: rows.reduce((sum, r) => sum + r.credit, 0),
  };
}

// ---------------------------------------------------------------------
// Income Statement
// ---------------------------------------------------------------------

export interface StatementLineAmount {
  accountId: string;
  code: string;
  name: string;
  amount: number;
}

export interface IncomeStatement {
  revenueRows: StatementLineAmount[];
  expenseRows: StatementLineAmount[];
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
}

function groupByAccount(lines: RawLedgerLine[], sign: (line: RawLedgerLine) => number): StatementLineAmount[] {
  const byAccount = new Map<string, StatementLineAmount>();
  for (const line of lines) {
    const existing = byAccount.get(line.accountId);
    const amount = (existing?.amount ?? 0) + sign(line);
    byAccount.set(line.accountId, { accountId: line.accountId, code: line.accountCode, name: line.accountName, amount });
  }
  return [...byAccount.values()].filter((r) => Math.abs(r.amount) > 0.005).sort((a, b) => a.code.localeCompare(b.code));
}

export function buildIncomeStatement(lines: RawLedgerLine[], dateFrom: string, dateTo: string): IncomeStatement {
  const inRange = lines.filter((l) => l.entryDate >= dateFrom && l.entryDate <= dateTo);

  const revenueRows = groupByAccount(
    inRange.filter((l) => l.accountType === "REVENUE"),
    (l) => l.credit - l.debit,
  );
  const expenseRows = groupByAccount(
    inRange.filter((l) => l.accountType === "EXPENSE"),
    (l) => l.debit - l.credit,
  );

  const totalRevenue = revenueRows.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = expenseRows.reduce((sum, r) => sum + r.amount, 0);

  return { revenueRows, expenseRows, totalRevenue, totalExpense, netProfit: totalRevenue - totalExpense };
}

// ---------------------------------------------------------------------
// Balance Sheet
// ---------------------------------------------------------------------

export interface BalanceSheet {
  assetRows: StatementLineAmount[];
  liabilityRows: StatementLineAmount[];
  equityRows: StatementLineAmount[];
  /** Revenue minus expenses since inception, up to asOfDate — not yet closed into an equity account by any period-close process. */
  netIncomeToDate: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
}

/**
 * Assets = Liabilities + Equity + Net Income To Date. This app never runs
 * a period-close (transferring P&L into Retained Earnings via a closing
 * journal entry), so accumulated net income is folded into the statement
 * as a synthetic line rather than assumed to already be inside an equity
 * account — otherwise the statement simply wouldn't balance.
 */
export function buildBalanceSheet(lines: RawLedgerLine[], asOfDate: string): BalanceSheet {
  const upToDate = lines.filter((l) => l.entryDate <= asOfDate);

  const assetRows = groupByAccount(
    upToDate.filter((l) => l.accountType === "ASSET"),
    (l) => l.debit - l.credit,
  );
  const liabilityRows = groupByAccount(
    upToDate.filter((l) => l.accountType === "LIABILITY"),
    (l) => l.credit - l.debit,
  );
  const equityRows = groupByAccount(
    upToDate.filter((l) => l.accountType === "EQUITY"),
    (l) => l.credit - l.debit,
  );

  const revenueToDate = upToDate.filter((l) => l.accountType === "REVENUE").reduce((sum, l) => sum + l.credit - l.debit, 0);
  const expenseToDate = upToDate.filter((l) => l.accountType === "EXPENSE").reduce((sum, l) => sum + l.debit - l.credit, 0);
  const netIncomeToDate = revenueToDate - expenseToDate;

  const totalAssets = assetRows.reduce((sum, r) => sum + r.amount, 0);
  const totalLiabilities = liabilityRows.reduce((sum, r) => sum + r.amount, 0);
  const totalEquity = equityRows.reduce((sum, r) => sum + r.amount, 0) + netIncomeToDate;

  return {
    assetRows,
    liabilityRows,
    equityRows,
    netIncomeToDate,
    totalAssets,
    totalLiabilities,
    totalEquity,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
  };
}

// ---------------------------------------------------------------------
// Cash Flow Statement
// ---------------------------------------------------------------------

export type CashFlowBucket = "operating" | "investing" | "financing";

export interface CashFlowStatement {
  operating: number;
  investing: number;
  financing: number;
  netChangeFromActivities: number;
  openingCash: number;
  closingCash: number;
  actualNetChange: number;
  isReconciled: boolean;
}

function classifyBucket(type: AccountType, subtype: string): CashFlowBucket {
  if (type === "REVENUE" || type === "EXPENSE") return "operating";
  if (type === "ASSET") return subtype === "Non-current Asset" ? "investing" : "operating";
  if (type === "LIABILITY") return subtype === "Non-current Liability" ? "financing" : "operating";
  return "financing"; // EQUITY
}

/**
 * Direct-method cash flow, derived straight from the journal — no separate
 * "activity type" tag needed on each account. For every journal entry that
 * moves cash within the period, its non-cash line(s) say *why* the cash
 * moved: a Revenue/Expense contra is Operating, a Non-current Asset contra
 * is Investing (equipment etc.), a Non-current Liability or Equity contra
 * is Financing (loans, owner capital/drawings), and a Current Asset/
 * Liability contra (AR/Inventory/AP) is Operating. An entry whose non-cash
 * lines span more than one bucket falls back to Operating — a deliberate
 * simplification for the (currently rare, single-contra-account) mixed
 * case rather than trying to split one cash movement across buckets.
 */
export function buildCashFlowStatement(lines: RawLedgerLine[], dateFrom: string, dateTo: string): CashFlowStatement {
  const byEntry = new Map<string, RawLedgerLine[]>();
  for (const line of lines) {
    const existing = byEntry.get(line.entryId);
    if (existing) existing.push(line);
    else byEntry.set(line.entryId, [line]);
  }

  let operating = 0;
  let investing = 0;
  let financing = 0;

  for (const entryLines of byEntry.values()) {
    const entryDate = entryLines[0].entryDate;
    if (entryDate < dateFrom || entryDate > dateTo) continue;

    const cashLines = entryLines.filter(isCash);
    if (cashLines.length === 0) continue;

    const cashMovement = cashLines.reduce((sum, l) => sum + l.debit - l.credit, 0);
    if (Math.abs(cashMovement) < 0.005) continue;

    const contraLines = entryLines.filter((l) => !isCash(l));
    const buckets = new Set(contraLines.map((l) => classifyBucket(l.accountType, l.accountSubtype)));
    const bucket: CashFlowBucket = buckets.size === 1 ? [...buckets][0] : "operating";

    if (bucket === "operating") operating += cashMovement;
    else if (bucket === "investing") investing += cashMovement;
    else financing += cashMovement;
  }

  const openingCash = lines.filter((l) => isCash(l) && l.entryDate < dateFrom).reduce((sum, l) => sum + l.debit - l.credit, 0);
  const closingCash = lines.filter((l) => isCash(l) && l.entryDate <= dateTo).reduce((sum, l) => sum + l.debit - l.credit, 0);
  const netChangeFromActivities = operating + investing + financing;
  const actualNetChange = closingCash - openingCash;

  return {
    operating,
    investing,
    financing,
    netChangeFromActivities,
    openingCash,
    closingCash,
    actualNetChange,
    isReconciled: Math.abs(netChangeFromActivities - actualNetChange) < 0.01,
  };
}
