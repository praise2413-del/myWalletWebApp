import { CASH_ACCOUNT_CODES, buildIncomeStatement, type RawLedgerLine } from "@/features/business/lib/statements";
import type { BusinessGoal } from "@/types";

export interface GoalProgress {
  currentValue: number;
  percent: number;
  isAchieved: boolean;
}

function cashBalanceAsOf(lines: RawLedgerLine[], asOfDate: string): number {
  return lines
    .filter((l) => CASH_ACCOUNT_CODES.includes(l.accountCode) && l.entryDate <= asOfDate)
    .reduce((sum, l) => sum + l.debit - l.credit, 0);
}

/** Progress is always computed live from posted data — never a manually-entered "how much have I saved so far" field that could drift from the real books. */
export function buildGoalProgress(goal: BusinessGoal, lines: RawLedgerLine[], today: string): GoalProgress {
  let currentValue: number;

  if (goal.goalType === "CASH_RESERVE") {
    currentValue = cashBalanceAsOf(lines, today);
  } else {
    const endDate = today > goal.startDate ? today : goal.startDate;
    const income = buildIncomeStatement(lines, goal.startDate, endDate);
    currentValue = goal.goalType === "REVENUE" ? income.totalRevenue : income.netProfit;
  }

  const percent = goal.targetAmount > 0 ? Math.max(0, Math.min(100, (currentValue / goal.targetAmount) * 100)) : 0;

  return { currentValue, percent, isAchieved: currentValue >= goal.targetAmount };
}
