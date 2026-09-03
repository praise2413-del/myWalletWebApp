import { format } from "date-fns";
import type { ReportModel } from "@/features/reports/lib/reportModel";

export function ReportDocumentHeader({ model }: { model: ReportModel }) {
  return (
    <header className="flex flex-col items-center border-b border-border px-6 py-10 text-center sm:py-12">
      <p className="text-2xl font-bold tracking-tight text-primary-600 dark:text-primary-500">myWallet</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Financial Report</p>
      <h1 className="mt-4 text-xl font-semibold text-text-primary sm:text-2xl">{model.periodTitle}</h1>
      <p className="mt-2 text-xs text-text-tertiary">Generated {format(model.generatedAt, "MMMM d, yyyy")}</p>
    </header>
  );
}
