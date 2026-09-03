import { IncomeVsExpenseCard } from "@/features/reports/components/IncomeVsExpenseCard";
import type { ReportModel } from "@/features/reports/lib/reportModel";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";

function StatTile({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className={`mt-1.5 text-lg font-bold tracking-tight ${valueClassName ?? "text-text-primary"}`}>{value}</p>
    </div>
  );
}

export function ExecutiveSummarySection({ model }: { model: ReportModel }) {
  const { summary } = model;

  return (
    <section className="px-6 py-8">
      <h2 className="text-base font-semibold text-text-primary">Executive Financial Summary</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Income" value={formatCurrency(summary.income, model.currency)} valueClassName="text-income-600 dark:text-income-500" />
        <StatTile label="Expenses" value={formatCurrency(summary.expenses, model.currency)} valueClassName="text-expense-600 dark:text-expense-500" />
        <StatTile label="Net Balance" value={formatCurrency(summary.netBalance, model.currency)} />
        <StatTile label="Savings" value={formatCurrency(summary.savings, model.currency)} valueClassName="text-blue-600 dark:text-blue-400" />
        <StatTile label="Investments" value={formatCurrency(summary.investment, model.currency)} valueClassName="text-indigo-600 dark:text-indigo-400" />
        <StatTile
          label="Allocation Rate"
          value={summary.allocationRate === null ? "—" : formatPercent(summary.allocationRate, 1)}
          valueClassName="text-primary-600 dark:text-primary-500"
        />
      </div>

      <p className="mt-5 text-sm leading-relaxed text-text-secondary">{summary.executiveSummaryText}</p>

      <div className="mt-5">
        <IncomeVsExpenseCard income={summary.income} expenses={summary.expenses} currency={model.currency} />
      </div>
    </section>
  );
}
