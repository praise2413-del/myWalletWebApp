import { RecordsTable } from "@/features/reports/components/preview/RecordsTable";
import type { ReportModel } from "@/features/reports/lib/reportModel";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

const STATUS_PILL_CLASS: Record<string, string> = {
  exceeded: "bg-income-50 text-income-700 dark:text-income-500",
  reached: "bg-income-50 text-income-700 dark:text-income-500",
  "good-progress": "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  "building-habit": "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  overview: "bg-background text-text-secondary",
};

export function SavingsInvestmentSection({ model }: { model: ReportModel }) {
  const { savingsInvestment: si } = model;
  const rows = si.records.map((r) => ({
    ...r,
    accentClassName: r.allocationType === "SAVING" ? "bg-blue-500" : "bg-indigo-500",
  }));

  return (
    <section className="border-t border-border px-6 py-8">
      <h2 className="text-base font-semibold text-text-primary">Savings & Investment</h2>

      <div className="mt-4 rounded-xl border border-border bg-surface p-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-text-secondary">Savings</dt>
            <dd className="mt-0.5 font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(si.savings, model.currency)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Investments</dt>
            <dd className="mt-0.5 font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(si.investment, model.currency)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Total Allocation</dt>
            <dd className="mt-0.5 font-semibold text-text-primary">{formatCurrency(si.totalAllocation, model.currency)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Recorded Income</dt>
            <dd className="mt-0.5 font-semibold text-text-primary">{formatCurrency(si.income, model.currency)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Allocation Rate</dt>
            <dd className="mt-0.5 font-semibold text-text-primary">{si.rate === null ? "—" : formatPercent(si.rate, 1)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Target</dt>
            <dd className="mt-0.5 font-semibold text-text-primary">{formatPercent(si.target, 0)}</dd>
          </div>
        </dl>

        {si.rate !== null && (
          <div className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-background">
            <div
              className={cn("h-full rounded-full", si.rate >= si.target ? "bg-income-500" : "bg-blue-500")}
              style={{ width: `${Math.min(si.rate, 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-text-primary/40"
              style={{ left: `${Math.min(si.target, 100)}%` }}
              aria-hidden="true"
            />
          </div>
        )}

        {si.band && (
          <span className={cn("mt-4 inline-block rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_PILL_CLASS[si.band])}>
            {si.statusLabel}
          </span>
        )}

        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{si.message}</p>
        <p className="mt-3 text-xs text-text-tertiary">
          Allocation Rate = (Savings + Investments) ÷ Income × 100. This is your myWallet target, not a universal rule — allocation
          is tracked separately from expenses and never counted toward Total Expenses.
        </p>
      </div>

      <div className="mt-4">
        <RecordsTable
          rows={rows}
          currency={model.currency}
          labelHeader="Type"
          emptyLabel="No savings or investment activity recorded for this period."
          defaultAccentClassName="bg-blue-500"
        />
      </div>
    </section>
  );
}
