import { formatCurrency, formatPercent, safeDivide } from "@/lib/utils/currency";

export interface CategoryTotal {
  name: string;
  amount: number;
}

export interface TopCategoryInsight {
  title: string;
  body: string;
}

/**
 * The simplest possible descriptive insight: which category took the
 * largest share of this period's spending. Purely factual — no
 * invented comparison to a prior period (that's a comparative insight,
 * Phase 7's job, and needs its own real prior-period data to be honest).
 */
export function getTopCategoryInsight(
  categoryTotals: CategoryTotal[],
  totalExpenses: number,
  currency: string,
): TopCategoryInsight | null {
  if (categoryTotals.length === 0 || totalExpenses <= 0) return null;

  const top = [...categoryTotals].sort((a, b) => b.amount - a.amount)[0];
  const share = formatPercent(safeDivide(top.amount, totalExpenses) * 100, 0);

  return {
    title: `${top.name} is your largest expense category`,
    body: `You spent ${formatCurrency(top.amount, currency)} on ${top.name}, representing ${share} of your total expenses this period.`,
  };
}
