import { describe, expect, it } from "vitest";
import { formatAmount, formatCurrency, formatPercent, formatSignedCurrency, safeDivide } from "@/lib/utils/currency";

describe("formatAmount", () => {
  it("rounds to the nearest whole unit and adds thousands separators", () => {
    expect(formatAmount(1234.6)).toBe("1,235");
  });

  it("never renders NaN or Infinity", () => {
    expect(formatAmount(Number.NaN)).toBe("0");
    expect(formatAmount(Number.POSITIVE_INFINITY)).toBe("0");
  });
});

describe("formatCurrency", () => {
  it("prefixes the amount with the currency code", () => {
    expect(formatCurrency(50000, "USD")).toBe("USD 50,000");
  });

  it("defaults to TZS when no currency is given", () => {
    expect(formatCurrency(1000)).toBe("TZS 1,000");
  });
});

describe("formatSignedCurrency", () => {
  it("prefixes income with a plus sign", () => {
    expect(formatSignedCurrency(500, "INCOME", "TZS")).toBe("+TZS 500");
  });

  it("prefixes expense with a minus sign, using the absolute value", () => {
    expect(formatSignedCurrency(-500, "EXPENSE", "TZS")).toBe("-TZS 500");
    expect(formatSignedCurrency(500, "EXPENSE", "TZS")).toBe("-TZS 500");
  });
});

describe("formatPercent", () => {
  it("formats to the given number of fraction digits", () => {
    expect(formatPercent(42.567, 1)).toBe("42.6%");
    expect(formatPercent(42, 0)).toBe("42%");
  });

  it("never renders NaN or Infinity", () => {
    expect(formatPercent(Number.NaN)).toBe("0%");
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe("0%");
  });
});

describe("safeDivide", () => {
  it("divides normally when the denominator is non-zero", () => {
    expect(safeDivide(50, 200)).toBe(0.25);
  });

  it("returns 0 instead of Infinity/NaN when dividing by zero", () => {
    expect(safeDivide(50, 0)).toBe(0);
    expect(safeDivide(0, 0)).toBe(0);
  });
});
