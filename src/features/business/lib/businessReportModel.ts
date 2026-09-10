import {
  buildBalanceSheet,
  buildCashFlowStatement,
  buildIncomeStatement,
  buildTrialBalance,
  type BalanceSheet,
  type CashFlowStatement,
  type IncomeStatement,
  type RawLedgerLine,
  type TrialBalance,
} from "@/features/business/lib/statements";
import type { Business } from "@/types";

export interface BusinessReportModel {
  businessName: string;
  currency: string;
  dateFrom: string;
  dateTo: string;
  periodTitle: string;
  generatedAt: Date;
  filename: string;
  isEmpty: boolean;
  trialBalance: TrialBalance;
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlow: CashFlowStatement;
}

function formatDateLabel(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Builds a safe filename fragment — no slashes/colons that would break a downloaded file name. */
function safeSlug(text: string): string {
  return text.replace(/[^A-Za-z0-9-]/g, "-").replace(/-+/g, "-");
}

export function buildBusinessReportModel(business: Business, lines: RawLedgerLine[], dateFrom: string, dateTo: string): BusinessReportModel {
  const periodTitle = `${formatDateLabel(dateFrom)} – ${formatDateLabel(dateTo)}`;

  return {
    businessName: business.name,
    currency: business.currency,
    dateFrom,
    dateTo,
    periodTitle,
    generatedAt: new Date(),
    filename: `${safeSlug(business.name)}-Financial-Report-${dateFrom}-to-${dateTo}.pdf`,
    isEmpty: lines.length === 0,
    trialBalance: buildTrialBalance(lines, dateTo),
    incomeStatement: buildIncomeStatement(lines, dateFrom, dateTo),
    balanceSheet: buildBalanceSheet(lines, dateTo),
    cashFlow: buildCashFlowStatement(lines, dateFrom, dateTo),
  };
}
