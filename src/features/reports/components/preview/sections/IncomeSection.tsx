import { RecordsTable } from "@/features/reports/components/preview/RecordsTable";
import type { ReportModel } from "@/features/reports/lib/reportModel";
import { formatPercent } from "@/lib/utils/currency";

export function IncomeSection({ model }: { model: ReportModel }) {
  const { income } = model;

  return (
    <section className="border-t border-border px-6 py-8">
      <h2 className="text-base font-semibold text-text-primary">Income Analysis</h2>
      <p className="mt-1 text-sm text-text-secondary">
        {income.count} {income.count === 1 ? "record" : "records"}
        {income.trendPercent !== 0 && (
          <>
            {" "}
            · {income.trendPercent > 0 ? "up" : "down"} {formatPercent(Math.abs(income.trendPercent), 0)} vs. the previous period
          </>
        )}
      </p>

      <div className="mt-4">
        <RecordsTable
          rows={income.records}
          currency={model.currency}
          labelHeader="Source"
          emptyLabel="No income recorded for this period."
          defaultAccentClassName="bg-income-500"
        />
      </div>
    </section>
  );
}
