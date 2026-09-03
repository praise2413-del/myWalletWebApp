import { isThisMonth, isThisYear } from "date-fns";
import { Download, FileText, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SpendingTrendCard } from "@/features/dashboard/components/SpendingTrendCard";
import { useInsightsData } from "@/features/insights/hooks/useInsightsData";
import { ExecutiveSummarySection } from "@/features/reports/components/preview/sections/ExecutiveSummarySection";
import { ExpenseSection } from "@/features/reports/components/preview/sections/ExpenseSection";
import { IncomeSection } from "@/features/reports/components/preview/sections/IncomeSection";
import { InsightsSection } from "@/features/reports/components/preview/sections/InsightsSection";
import { ReportDocumentHeader } from "@/features/reports/components/preview/sections/ReportDocumentHeader";
import { SavingsInvestmentSection } from "@/features/reports/components/preview/sections/SavingsInvestmentSection";
import { fetchReportRecords, type ReportRecords } from "@/features/reports/lib/fetchReportRecords";
import { generateReportPdf, PdfModuleLoadError } from "@/features/reports/lib/pdf/generateReportPdf";
import { buildReportModel } from "@/features/reports/lib/reportModel";
import type { ReportData } from "@/features/reports/hooks/useReportsData";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useToastStore } from "@/hooks/useToastStore";
import type { CustomDateRange } from "@/lib/utils/period";
import type { ReportPeriod } from "@/types";

interface ReportPreviewOverlayProps {
  onClose: () => void;
  period: ReportPeriod;
  customRange?: CustomDateRange;
  reportData: ReportData;
  currency: string;
  allocationTarget: number;
}

type GenerationStatus = "preparing" | "insights" | "ready" | "error";

const STATUS_LABEL: Record<Exclude<GenerationStatus, "ready" | "error">, string> = {
  preparing: "Preparing your report…",
  insights: "Preparing financial insights…",
};

export function ReportPreviewOverlay({ onClose, period, customRange, reportData, currency, allocationTarget }: ReportPreviewOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(true, containerRef);
  const { showToast } = useToastStore();

  const [recordsState, setRecordsState] = useState<{ data?: ReportRecords; error?: string } | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<{ message: string; staleBuild: boolean } | null>(null);

  const rangeStartKey = reportData.range.start.getTime();
  const rangeEndKey = reportData.range.end.getTime();

  useEffect(() => {
    let active = true;
    setRecordsState(null);
    fetchReportRecords(reportData.range).then((res) => {
      if (active) setRecordsState(res);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStartKey, rangeEndKey, retryToken]);

  useEffect(() => {
    if (!containerRef.current) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Behavioral ("ongoing pattern") insights are anchored to a trailing
  // 6-months-to-today window (see useInsightsData) — meaningful for a report
  // covering the current month/year, misleading for a report about the past.
  const behavioralGateOpen =
    (period === "monthly" && isThisMonth(reportData.range.start)) || (period === "yearly" && isThisYear(reportData.range.start));
  const insightsData = useInsightsData();
  const behavioralReady = !behavioralGateOpen || !insightsData.loading;

  const model = useMemo(() => {
    if (!recordsState?.data || !behavioralReady) return null;
    const behavioralInsights = behavioralGateOpen
      ? [...insightsData.data.behavioral, ...insightsData.data.allocationBehavioral]
      : undefined;
    return buildReportModel({
      period,
      customRange,
      reportData,
      records: recordsState.data,
      currency,
      allocationTarget,
      behavioralInsights,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordsState, behavioralReady, behavioralGateOpen, period, customRange, reportData, currency, allocationTarget]);

  const status: GenerationStatus = recordsState?.error
    ? "error"
    : !recordsState
      ? "preparing"
      : !behavioralReady
        ? "insights"
        : "ready";

  async function handleDownload() {
    if (!model) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await generateReportPdf(model);
      showToast("Report downloaded.", "success");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Report PDF generation failed:", err);
      if (err instanceof PdfModuleLoadError) {
        setDownloadError({
          message: "myWallet was updated since you opened this page, so the PDF tool couldn't load. Refresh the page and try again.",
          staleBuild: true,
        });
      } else {
        setDownloadError({ message: "We couldn't generate the PDF. Please try again.", staleBuild: false });
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40 p-0 sm:p-6">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-preview-title"
        tabIndex={-1}
        className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden bg-surface-elevated shadow-[var(--shadow-popover)] focus:outline-none sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="report-preview-title" className="text-base font-semibold text-text-primary">
            Report Preview
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report preview"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-background">
          {status !== "ready" && status !== "error" && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
              <Loader2 className="size-6 animate-spin text-primary-600 dark:text-primary-500" aria-hidden="true" />
              <p className="text-sm font-medium text-text-secondary">{STATUS_LABEL[status]}</p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 px-6 py-16">
              <AlertBanner message={recordsState?.error ?? "We couldn't generate your report."} />
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setRetryToken((t) => t + 1)}>
                  Try again
                </Button>
              </div>
            </div>
          )}

          {status === "ready" && model && (
            <div className="mx-auto max-w-2xl bg-surface-elevated shadow-[var(--shadow-card)] sm:my-6 sm:rounded-2xl">
              <ReportDocumentHeader model={model} />

              {model.isEmpty ? (
                <div className="px-6 py-10">
                  <EmptyState
                    icon={FileText}
                    title="No financial activity recorded for this period."
                    description="Start recording your income and expenses to generate a meaningful financial report."
                  />
                </div>
              ) : (
                <>
                  <ExecutiveSummarySection model={model} />
                  <IncomeSection model={model} />
                  <ExpenseSection model={model} />
                  <SavingsInvestmentSection model={model} />

                  {model.charts.trend.some((p) => p.amount > 0) && (
                    <section className="border-t border-border px-6 py-8">
                      <h2 className="mb-4 text-base font-semibold text-text-primary">Financial Trend</h2>
                      <SpendingTrendCard data={model.charts.trend} currency={model.currency} bucket={model.charts.trendBucket} />
                    </section>
                  )}

                  <InsightsSection model={model} />
                </>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-surface-elevated">
          {downloadError && (
            <div className="px-5 pt-4">
              <AlertBanner message={downloadError.message} />
            </div>
          )}
          <div className="flex items-center justify-end gap-3 px-5 py-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {downloadError?.staleBuild ? (
              <Button onClick={() => window.location.reload()}>Refresh page</Button>
            ) : (
              <Button onClick={handleDownload} disabled={status !== "ready" || !model || downloading}>
                {downloading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Download className="size-4" aria-hidden="true" />
                    Download PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
