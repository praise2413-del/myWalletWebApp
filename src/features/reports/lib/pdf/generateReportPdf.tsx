import { downloadBlob } from "@/lib/utils/downloadBlob";
import type { ReportModel } from "@/features/reports/lib/reportModel";

/**
 * Thrown specifically when the lazy-loaded PDF chunks fail to fetch — almost
 * always because a newer deploy has replaced the hashed chunk files this
 * already-open tab's bundle still points at, not a bug in report generation
 * itself. Kept distinct from any error `ReportPdfDocument` itself throws so
 * the UI can show "please refresh the page" instead of a generic failure.
 */
export class PdfModuleLoadError extends Error {
  constructor(cause: unknown) {
    super("Failed to load the PDF renderer module.");
    this.name = "PdfModuleLoadError";
    this.cause = cause;
  }
}

/**
 * Renders and downloads the PDF for a report. `@react-pdf/renderer` and the
 * document tree are dynamically imported so their ~400kB weight only loads
 * when a user actually generates a report, not on every Reports page visit.
 */
export async function generateReportPdf(model: ReportModel): Promise<void> {
  let pdfModule: typeof import("@react-pdf/renderer");
  let documentModule: typeof import("@/features/reports/lib/pdf/ReportPdfDocument");
  try {
    [pdfModule, documentModule] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/features/reports/lib/pdf/ReportPdfDocument"),
    ]);
  } catch (cause) {
    throw new PdfModuleLoadError(cause);
  }

  const { pdf } = pdfModule;
  const { ReportPdfDocument } = documentModule;
  const blob = await pdf(<ReportPdfDocument model={model} />).toBlob();
  downloadBlob(blob, model.filename);
}
