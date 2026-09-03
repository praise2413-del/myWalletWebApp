/**
 * Fixed light/print palette for the PDF, sampled from the `:root` (light
 * mode) values in `src/index.css`. The PDF prioritizes document readability
 * and printing over mirroring the app's dark UI (spec §24) — react-pdf has
 * no concept of a CSS variable or theme, so these are the same hex values
 * baked in once here rather than re-guessed.
 */
export const pdfPalette = {
  background: "#F6F7F8",
  surface: "#FFFFFF",
  border: "#E7E9EC",
  borderStrong: "#D8DBE0",

  textPrimary: "#10161A",
  textSecondary: "#5B6470",
  textTertiary: "#94A0AC",

  primary: "#057A61",
  primaryLight: "#EAFBF5",

  income: "#057A61",
  incomeLight: "#EAFBF5",

  expense: "#C23F2F",
  expenseLight: "#FDF2F1",

  warning: "#D97706",
  warningLight: "#FFFBEB",

  /** Reused from the app's existing chart-4 blue — Savings, per spec §11. */
  savings: "#3B82C4",
  savingsLight: "#EAF2FA",
  /** Reused from the app's existing chart-2 indigo — Investment, per spec §11. */
  investment: "#7875EB",
  investmentLight: "#EEEDFC",

  chartNeutral: "#94A0AC",
  chartSeries: ["#057A61", "#7875EB", "#FD8064", "#3B82C4", "#C2A83E", "#94A0AC"],
};
