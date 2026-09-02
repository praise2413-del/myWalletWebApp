const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) return "0";
  return amountFormatter.format(Math.round(amount));
}

export function formatCurrency(amount: number, currency: string = "TZS"): string {
  return `${currency} ${formatAmount(amount)}`;
}

export function formatSignedCurrency(
  amount: number,
  type: "INCOME" | "EXPENSE",
  currency: string = "TZS",
): string {
  const sign = type === "INCOME" ? "+" : "-";
  return `${sign}${formatCurrency(Math.abs(amount), currency)}`;
}

export function formatPercent(value: number, fractionDigits = 1): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(fractionDigits)}%`;
}

export function safeDivide(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : 0;
}
