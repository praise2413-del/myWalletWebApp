import { downloadBlob } from "@/lib/utils/downloadBlob";
import type { ReportModel } from "@/features/reports/lib/reportModel";

/**
 * Renders and downloads the PDF for a report. `@react-pdf/renderer` and the
 * document tree are dynamically imported so their ~400kB weight only loads
 * when a user actually generates a report, not on every Reports page visit.
 */
export async function generateReportPdf(model: ReportModel): Promise<void> {
  const [{ pdf }, { ReportPdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/features/reports/lib/pdf/ReportPdfDocument"),
  ]);

  const blob = await pdf(<ReportPdfDocument model={model} />).toBlob();
  downloadBlob(blob, model.filename);
}
