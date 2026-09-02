import { AlertTriangle, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Insight } from "@/types";

const TONE_CONFIG = {
  positive: {
    icon: Sparkles,
    iconClass: "bg-primary-50 text-primary-600 dark:text-primary-500",
    badgeClass: "bg-primary-50 text-primary-700 dark:text-primary-500",
    label: "Positive",
  },
  attention: {
    icon: AlertTriangle,
    iconClass: "bg-warning-50 text-warning-600",
    badgeClass: "bg-warning-50 text-warning-700",
    label: "Attention",
  },
  observation: {
    icon: Lightbulb,
    iconClass: "bg-background text-text-secondary",
    badgeClass: "bg-background text-text-secondary",
    label: "Observation",
  },
} as const;

export function InsightCard({ insight }: { insight: Insight }) {
  const config = TONE_CONFIG[insight.tone];
  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", config.iconClass)}>
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
              config.badgeClass,
            )}
          >
            {config.label}
          </span>
          <p className="text-sm font-semibold leading-snug text-text-primary">{insight.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">{insight.explanation}</p>
          {insight.comparison && <p className="mt-1.5 text-xs text-text-tertiary">{insight.comparison}</p>}
        </div>
      </div>
    </div>
  );
}
