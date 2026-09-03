import type { ReportRecord, ReportRecords } from "@/features/reports/lib/fetchReportRecords";
import { getReportPeriodLabel, reportPeriodKindLabel } from "@/features/reports/lib/reportPeriod";
import { buildReportFilename } from "@/features/reports/lib/filename";
import type { CategoryChange, ReportData } from "@/features/reports/hooks/useReportsData";
import { type AllocationBand, getAllocationInsight } from "@/lib/insights/allocation";
import { generateComparativeInsights } from "@/lib/insights/comparative";
import { generateDescriptiveInsights } from "@/lib/insights/descriptive";
import { formatCurrency, formatPercent, safeDivide } from "@/lib/utils/currency";
import type { CustomDateRange } from "@/lib/utils/period";
import type { Insight, ReportPeriod } from "@/types";

export type ReportInsightSection = "spending" | "income" | "allocation" | "behavioral";

export interface ReportInsight {
  section: ReportInsightSection;
  insight: Insight;
}

export interface ReportModel {
  currency: string;
  periodKindLabel: string;
  periodTitle: string;
  filename: string;
  generatedAt: Date;
  rangeStart: Date;
  rangeEnd: Date;
  isEmpty: boolean;

  summary: {
    income: number;
    expenses: number;
    savings: number;
    investment: number;
    totalAllocation: number;
    netBalance: number;
    allocationRate: number | null;
    allocationTarget: number;
    executiveSummaryText: string;
  };

  income: {
    total: number;
    count: number;
    trendPercent: number;
    records: ReportRecord[];
  };

  expense: {
    total: number;
    count: number;
    largestCategory: { name: string; amount: number } | null;
    distribution: { name: string; amount: number }[];
    trendPercent: number;
    records: ReportRecord[];
  };

  savingsInvestment: {
    savings: number;
    investment: number;
    totalAllocation: number;
    income: number;
    rate: number | null;
    target: number;
    band: AllocationBand | null;
    statusLabel: string;
    message: string;
    records: ReportRecords["allocationRecords"];
  };

  charts: {
    incomeVsExpense: { income: number; expenses: number };
    expenseDistribution: { name: string; amount: number }[];
    trend: { date: string; amount: number }[];
    trendBucket: "day" | "month";
    allocationVsTarget: { rate: number; target: number };
  };

  insights: ReportInsight[];

  records: ReportRecords;
}

const STATUS_LABEL: Record<AllocationBand, string> = {
  exceeded: "Target Exceeded",
  reached: "Target Reached",
  "good-progress": "Good Progress",
  "building-habit": "Building the Habit",
  overview: "Building Momentum",
};

function periodPhrase(period: ReportPeriod, title: string): string {
  switch (period) {
    case "daily":
      return `on ${title}`;
    case "weekly":
      return `during the ${title}`;
    case "yearly":
      return `in ${title}`;
    case "custom":
      return `during ${title}`;
    case "monthly":
    default:
      return `in ${title}`;
  }
}

function classifyInsightSection(id: string): ReportInsightSection {
  if (id === "allocation-status") return "allocation";
  if (id === "descriptive-total-spent" || id === "descriptive-top-category" || id.startsWith("comparative-category-") || id === "comparative-total-expenses") {
    return "spending";
  }
  return "income";
}

function buildExecutiveSummary(input: {
  income: number;
  expenses: number;
  totalAllocation: number;
  netBalance: number;
  rate: number | null;
  currency: string;
  periodPhraseText: string;
}): string {
  const { income, expenses, totalAllocation, netBalance, rate, currency, periodPhraseText } = input;

  if (income === 0 && expenses === 0 && totalAllocation === 0) {
    return `No financial activity was recorded ${periodPhraseText}.`;
  }

  const balancePhrase =
    netBalance >= 0
      ? `a positive net balance of ${formatCurrency(netBalance, currency)}`
      : `a net balance of ${formatCurrency(netBalance, currency)}, as expenses exceeded recorded income`;

  const allocationPhrase =
    totalAllocation > 0
      ? ` Of that, ${formatCurrency(totalAllocation, currency)}${rate !== null ? ` (${formatPercent(rate, 1)} of income)` : ""} was set aside as savings and investments, separate from expenses.`
      : "";

  return `${periodPhraseText[0].toUpperCase()}${periodPhraseText.slice(1)}, you recorded ${formatCurrency(income, currency)} in income and ${formatCurrency(expenses, currency)} in expenses, resulting in ${balancePhrase}.${allocationPhrase}`;
}

export interface BuildReportModelInput {
  period: ReportPeriod;
  customRange?: CustomDateRange;
  reportData: ReportData;
  records: ReportRecords;
  currency: string;
  allocationTarget: number;
  behavioralInsights?: Insight[];
}

/**
 * Assembles the single `ReportModel` that both the on-screen preview and the
 * PDF render from. Every number here comes from `useReportsData`'s already
 * fetched/aggregated figures (or the one additional `fetchReportRecords`
 * call for row-level detail) and the existing insight-engine functions —
 * no calculation is duplicated or re-derived independently.
 */
export function buildReportModel(input: BuildReportModelInput): ReportModel {
  const { period, customRange, reportData, records, currency, allocationTarget, behavioralInsights } = input;
  const { range, summary } = reportData;

  const { title: periodTitle } = getReportPeriodLabel(period, range, customRange);
  const periodKindLabel = reportPeriodKindLabel(period);
  const filename = buildReportFilename(period, range, customRange);

  const savings = reportData.allocation.savings;
  const investment = reportData.allocation.investment;
  const totalAllocation = savings + investment;
  const netBalance = summary.income - summary.expenses;

  const allocationResult = getAllocationInsight({
    income: summary.income,
    savings,
    investment,
    target: allocationTarget,
    currency,
  });

  const savingsInvestment: ReportModel["savingsInvestment"] = (() => {
    if (allocationResult.status === "no-income") {
      return {
        savings,
        investment,
        totalAllocation,
        income: summary.income,
        rate: null,
        target: allocationTarget,
        band: null,
        statusLabel: "Not enough income data",
        message: allocationResult.message,
        records: records.allocationRecords,
      };
    }
    if (allocationResult.status === "no-allocation") {
      return {
        savings,
        investment,
        totalAllocation,
        income: summary.income,
        rate: 0,
        target: allocationTarget,
        band: null,
        statusLabel: "No allocation recorded",
        message: allocationResult.message,
        records: records.allocationRecords,
      };
    }
    const calc = allocationResult.calculation;
    return {
      savings,
      investment,
      totalAllocation,
      income: summary.income,
      rate: calc.rate,
      target: allocationTarget,
      band: calc.band,
      statusLabel: STATUS_LABEL[calc.band],
      message: allocationResult.insight.explanation,
      records: records.allocationRecords,
    };
  })();

  const allocationRate = allocationResult.status === "calculated" ? allocationResult.calculation.rate : allocationResult.status === "no-allocation" ? 0 : null;

  const periodPhraseText = periodPhrase(period, periodTitle);

  const descriptive = generateDescriptiveInsights({
    income: summary.income,
    expenses: summary.expenses,
    netCashFlow: netBalance,
    topCategory: summary.highestCategory,
    currency,
    periodLabel: periodPhraseText,
  });

  const comparative = generateComparativeInsights({
    income: summary.income,
    previousIncome: summary.previousIncome,
    expenses: summary.expenses,
    previousExpenses: summary.previousExpenses,
    categoryChanges: reportData.categoryChanges as CategoryChange[],
    currency,
  });

  const insights: ReportInsight[] = [
    ...descriptive.map((insight) => ({ section: classifyInsightSection(insight.id), insight })),
    ...comparative.map((insight) => ({ section: classifyInsightSection(insight.id), insight })),
  ];

  if (allocationResult.status === "calculated") {
    insights.push({ section: "allocation", insight: allocationResult.insight });
  }

  for (const insight of behavioralInsights ?? []) {
    insights.push({ section: "behavioral", insight });
  }

  const isEmpty = summary.income === 0 && summary.expenses === 0 && totalAllocation === 0;

  return {
    currency,
    periodKindLabel,
    periodTitle,
    filename,
    generatedAt: new Date(),
    rangeStart: range.start,
    rangeEnd: range.end,
    isEmpty,
    summary: {
      income: summary.income,
      expenses: summary.expenses,
      savings,
      investment,
      totalAllocation,
      netBalance,
      allocationRate,
      allocationTarget,
      executiveSummaryText: buildExecutiveSummary({
        income: summary.income,
        expenses: summary.expenses,
        totalAllocation,
        netBalance,
        rate: allocationRate,
        currency,
        periodPhraseText,
      }),
    },
    income: {
      total: summary.income,
      count: records.incomeRecords.length,
      trendPercent: summary.deltas.income,
      records: records.incomeRecords,
    },
    expense: {
      total: summary.expenses,
      count: records.expenseRecords.length,
      largestCategory: summary.highestCategory,
      distribution: reportData.categoryDistribution,
      trendPercent: summary.deltas.expenses,
      records: records.expenseRecords,
    },
    savingsInvestment,
    charts: {
      incomeVsExpense: { income: summary.income, expenses: summary.expenses },
      expenseDistribution: reportData.categoryDistribution,
      trend: reportData.spendingTrend,
      trendBucket: reportData.trendBucket,
      allocationVsTarget: { rate: safeDivide(totalAllocation, summary.income) * 100, target: allocationTarget },
    },
    insights,
    records,
  };
}
