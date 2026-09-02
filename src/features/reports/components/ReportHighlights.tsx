import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatPercent, safeDivide } from "@/lib/utils/currency";
import type { NamedAmount } from "@/lib/utils/aggregate";

interface ReportHighlightsProps {
  income: number;
  expenses: number;
  netCashFlow: number;
  averageDailyExpense: number;
  highestCategory: NamedAmount | null;
  highestSpendingDay: { date: string; amount: number } | null;
  currency: string;
}

function formatDay(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ReportHighlights({
  income,
  expenses,
  netCashFlow,
  averageDailyExpense,
  highestCategory,
  highestSpendingDay,
  currency,
}: ReportHighlightsProps) {
  const sentences: string[] = [];

  sentences.push(
    netCashFlow >= 0
      ? `You brought in ${formatCurrency(income, currency)} and spent ${formatCurrency(expenses, currency)}, a net cash flow of ${formatCurrency(netCashFlow, currency)}.`
      : `Your expenses of ${formatCurrency(expenses, currency)} exceeded your recorded income of ${formatCurrency(income, currency)} this period.`,
  );

  if (highestCategory && expenses > 0) {
    const share = formatPercent(safeDivide(highestCategory.amount, expenses) * 100, 0);
    sentences.push(
      `${highestCategory.name} was your largest expense category at ${formatCurrency(highestCategory.amount, currency)} (${share} of total expenses).`,
    );
  }

  if (highestSpendingDay) {
    sentences.push(
      `Your highest spending day was ${formatDay(highestSpendingDay.date)}, at ${formatCurrency(highestSpendingDay.amount, currency)}.`,
    );
  }

  if (averageDailyExpense > 0) {
    sentences.push(`You spent an average of ${formatCurrency(averageDailyExpense, currency)} per day.`);
  }

  if (sentences.length === 0) return null;

  return (
    <Card>
      <CardContent className="flex gap-3 p-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <Lightbulb className="size-4.5 text-primary-600 dark:text-primary-500" aria-hidden="true" />
        </span>
        <ul className="space-y-1.5 text-sm text-text-secondary">
          {sentences.map((sentence) => (
            <li key={sentence}>{sentence}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
