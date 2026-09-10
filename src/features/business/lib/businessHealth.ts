import type { BusinessRatios } from "@/features/business/lib/ratios";
import { formatCurrency } from "@/lib/utils/currency";
import type { Insight } from "@/types";

export type HealthBand = "Strong" | "Stable" | "Needs Attention";

export interface HealthFactor {
  label: string;
  band: HealthBand;
  detail: string;
}

export interface BusinessHealth {
  band: HealthBand;
  summary: string;
  factors: HealthFactor[];
}

/**
 * Deterministic, documented thresholds — not a hidden model. Each factor is
 * independently understandable, and the overall band is the *most
 * cautious* of the three (never let a strong profit margin mask a real
 * liquidity problem) — same "describe facts, don't judge, don't
 * oversell" philosophy as the Personal Finance insights engine.
 */
export function buildBusinessHealth(ratios: BusinessRatios): BusinessHealth {
  const factors: HealthFactor[] = [];

  if (ratios.netProfitMargin !== null) {
    const band: HealthBand = ratios.netProfitMargin >= 10 ? "Strong" : ratios.netProfitMargin >= 0 ? "Stable" : "Needs Attention";
    factors.push({
      label: "Profitability",
      band,
      detail: `Net profit margin is ${ratios.netProfitMargin.toFixed(1)}% for this period.`,
    });
  }

  if (ratios.currentRatio !== null) {
    const band: HealthBand = ratios.currentRatio >= 1.5 ? "Strong" : ratios.currentRatio >= 1 ? "Stable" : "Needs Attention";
    factors.push({
      label: "Liquidity",
      band,
      detail: `Current ratio is ${ratios.currentRatio.toFixed(2)} — ${ratios.currentRatio.toFixed(2)} in short-term assets for every 1 in short-term liabilities.`,
    });
  }

  if (ratios.debtToEquity !== null) {
    const band: HealthBand = ratios.debtToEquity <= 1 ? "Strong" : ratios.debtToEquity <= 2 ? "Stable" : "Needs Attention";
    factors.push({
      label: "Leverage",
      band,
      detail: `Debt-to-equity is ${ratios.debtToEquity.toFixed(2)} — ${ratios.debtToEquity.toFixed(2)} in liabilities for every 1 in equity.`,
    });
  }

  const band: HealthBand = factors.some((f) => f.band === "Needs Attention")
    ? "Needs Attention"
    : factors.some((f) => f.band === "Stable")
      ? "Stable"
      : factors.length > 0
        ? "Strong"
        : "Stable";

  const summary =
    factors.length === 0
      ? "Not enough recorded activity yet to assess business health."
      : band === "Strong"
        ? "Profitability, liquidity, and leverage all look strong for this period."
        : band === "Needs Attention"
          ? "At least one area — profitability, liquidity, or leverage — needs attention this period."
          : "Business health is stable, with room to strengthen one or more areas.";

  return { band, summary, factors };
}

let insightCounter = 0;
function insight(tone: Insight["tone"], title: string, explanation: string, comparison?: string): Insight {
  insightCounter += 1;
  return { id: `business-insight-${insightCounter}`, tone, title, explanation, comparison };
}

/** Plain-language descriptive/comparative insights over the ratio set — same shape Personal Finance's own insight cards already render, reused as-is. */
export function buildBusinessRatioInsights(ratios: BusinessRatios, previous: BusinessRatios | null, currency: string): Insight[] {
  const insights: Insight[] = [];

  if (ratios.netProfitMargin !== null) {
    const comparison =
      previous?.netProfitMargin !== null && previous?.netProfitMargin !== undefined
        ? `${ratios.netProfitMargin >= previous.netProfitMargin ? "Up" : "Down"} from ${previous.netProfitMargin.toFixed(1)}% last period.`
        : undefined;
    insights.push(
      insight(
        ratios.netProfitMargin >= 0 ? "positive" : "attention",
        `Net profit margin: ${ratios.netProfitMargin.toFixed(1)}%`,
        `For every 100 of revenue this period, ${ratios.netProfitMargin.toFixed(1)} was kept as profit.`,
        comparison,
      ),
    );
  }

  if (ratios.currentRatio !== null) {
    insights.push(
      insight(
        ratios.currentRatio >= 1 ? "positive" : "attention",
        `Current ratio: ${ratios.currentRatio.toFixed(2)}`,
        ratios.currentRatio >= 1
          ? "Short-term assets cover short-term liabilities."
          : "Short-term liabilities currently exceed short-term assets.",
      ),
    );
  }

  if (Math.abs(ratios.workingCapital) > 0.005) {
    const isPositive = ratios.workingCapital > 0;
    insights.push(
      insight(
        isPositive ? "positive" : "attention",
        `Working capital: ${formatCurrency(Math.abs(ratios.workingCapital), currency)} ${isPositive ? "positive" : "negative"}`,
        isPositive
          ? `Current assets exceed current liabilities by ${formatCurrency(ratios.workingCapital, currency)}.`
          : `Current liabilities exceed current assets by ${formatCurrency(Math.abs(ratios.workingCapital), currency)}.`,
      ),
    );
  }

  if (ratios.debtToEquity !== null) {
    insights.push(
      insight(
        ratios.debtToEquity <= 1 ? "positive" : "observation",
        `Debt-to-equity: ${ratios.debtToEquity.toFixed(2)}`,
        "How much the business relies on liabilities versus owner equity to fund its assets.",
      ),
    );
  }

  return insights;
}
