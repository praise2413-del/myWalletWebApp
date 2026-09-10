import { Download, FileText, Loader2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { BalanceSheetView } from "@/features/business/components/statements/BalanceSheetView";
import { CashFlowStatementView } from "@/features/business/components/statements/CashFlowStatementView";
import { IncomeStatementView } from "@/features/business/components/statements/IncomeStatementView";
import { TrialBalanceView } from "@/features/business/components/statements/TrialBalanceView";
import { buildBusinessReportModel } from "@/features/business/lib/businessReportModel";
import { generateBusinessReportPdf, PdfModuleLoadError } from "@/features/business/lib/pdf/generateBusinessReportPdf";
import type { RawLedgerLine } from "@/features/business/lib/statements";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useToastStore } from "@/hooks/useToastStore";
import type { Business } from "@/types";

interface BusinessReportPreviewOverlayProps {
  onClose: () => void;
  business: Business;
  lines: RawLedgerLine[];
  dateFrom: string;
  dateTo: string;
}

export function BusinessReportPreviewOverlay({ onClose, business, lines, dateFrom, dateTo }: BusinessReportPreviewOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(true, containerRef);
  const showToast = useToastStore((state) => state.showToast);

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<{ message: string; staleBuild: boolean } | null>(null);

  const model = useMemo(() => buildBusinessReportModel(business, lines, dateFrom, dateTo), [business, lines, dateFrom, dateTo]);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      await generateBusinessReportPdf(model);
      showToast("Report downloaded.");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Business report PDF generation failed:", err);
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
        aria-labelledby="business-report-preview-title"
        tabIndex={-1}
        className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden bg-surface-elevated shadow-[var(--shadow-popover)] focus:outline-none sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="business-report-preview-title" className="text-base font-semibold text-text-primary">
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
          <div className="mx-auto max-w-2xl space-y-4 p-5 sm:py-6">
            <div className="rounded-2xl bg-surface-elevated px-6 py-8 text-center shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Financial Report</p>
              <h1 className="mt-2 text-xl font-bold text-text-primary">{model.businessName}</h1>
              <p className="mt-1 text-sm text-text-secondary">{model.periodTitle}</p>
              <p className="mt-3 text-xs text-text-tertiary">Generated {model.generatedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>

            {model.isEmpty ? (
              <EmptyState icon={FileText} title="No financial activity recorded yet" description="Post journal entries, sales, or purchases to generate a meaningful report." />
            ) : (
              <>
                <TrialBalanceView trialBalance={model.trialBalance} currency={model.currency} />
                <IncomeStatementView statement={model.incomeStatement} currency={model.currency} />
                <BalanceSheetView balanceSheet={model.balanceSheet} currency={model.currency} />
                <CashFlowStatementView statement={model.cashFlow} currency={model.currency} />
              </>
            )}
          </div>
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
              <Button onClick={handleDownload} disabled={downloading}>
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
