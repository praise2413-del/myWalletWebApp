import { cn } from "@/lib/utils/cn";
import type { ReportPeriod } from "@/types";

const OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom Range" },
];

interface ReportPeriodControlsProps {
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
}

export function ReportPeriodControls({
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: ReportPeriodControlsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onPeriodChange(option.value)}
            className={cn(
              "whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
              period === option.value ? "bg-primary-600 text-white" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="report-date-from">
            From date
          </label>
          <input
            id="report-date-from"
            type="date"
            value={customStart}
            max={customEnd || undefined}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
          />
          <span className="text-text-tertiary">–</span>
          <label className="sr-only" htmlFor="report-date-to">
            To date
          </label>
          <input
            id="report-date-to"
            type="date"
            value={customEnd}
            min={customStart || undefined}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
