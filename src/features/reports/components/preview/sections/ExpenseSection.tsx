import { SpendingOverviewCard } from "@/features/dashboard/components/SpendingOverviewCard";
import { RecordsTable } from "@/features/reports/components/preview/RecordsTable";
import type { ReportModel } from "@/features/reports/lib/reportModel";
import { formatPercent } from "@/lib/utils/currency";

export function ExpenseSection({ model }: { model: ReportModel }) {
  const { expense } = model;

  return (
    <section className="border-t border-border px-6 py-8">
      <h2 className="text-base font-semibold text-text-primary">Expense Analysis</h2>
      <p className="mt-1 text-sm text-text-secondary">
        {expense.count} {expense.count === 1 ? "record" : "records"}
        {expense.largestCategory && <> · Largest category: {expense.largestCategory.name}</>}
        {expense.trendPercent !== 0 && (
          <>
            {" "}
            · {expense.trendPercent > 0 ? "up" : "down"} {formatPercent(Math.abs(expense.trendPercent), 0)} vs. the previous period
          </>
        )}
      </p>

      {expense.distribution.length > 0 && (
        <div className="mt-4">
          <SpendingOverviewCard data={expense.distribution} currency={model.currency} />
        </div>
      )}

      <div className="mt-4">
        <RecordsTable
          rows={expense.records}
          currency={model.currency}
          labelHeader="Category"
          emptyLabel="No expenses recorded for this period."
          defaultAccentClassName="bg-expense-500"
        />
      </div>
    </section>
  );
}
