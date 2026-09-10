import { downloadBlob } from "@/lib/utils/downloadBlob";
import type { BusinessReportModel } from "@/features/business/lib/businessReportModel";

/** Same purpose as the personal report's PdfModuleLoadError — see that file for the full rationale. */
export class PdfModuleLoadError extends Error {
  constructor(cause: unknown) {
    super("Failed to load the PDF renderer module.");
    this.name = "PdfModuleLoadError";
    this.cause = cause;
  }
}

/**
 * Renders and downloads the PDF for a business financial report.
 * `@react-pdf/renderer` and the document tree are dynamically imported so
 * their weight only loads when a user actually generates a report — shares
 * the same `vendor-pdf` chunk the personal Reports feature already uses.
 */
export async function generateBusinessReportPdf(model: BusinessReportModel): Promise<void> {
  let pdfModule: typeof import("@react-pdf/renderer");
  let documentModule: typeof import("@/features/business/lib/pdf/BusinessReportPdfDocument");
  try {
    [pdfModule, documentModule] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/features/business/lib/pdf/BusinessReportPdfDocument"),
    ]);
  } catch (cause) {
    throw new PdfModuleLoadError(cause);
  }

  const { pdf } = pdfModule;
  const { BusinessReportPdfDocument } = documentModule;
  const blob = await pdf(<BusinessReportPdfDocument model={model} />).toBlob();
  downloadBlob(blob, model.filename);
}
