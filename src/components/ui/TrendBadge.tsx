import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPercent } from "@/lib/utils/currency";

interface TrendBadgeProps {
  changePercent: number;
  /** Whether an increase should read as favorable. Expenses set this false. */
  increaseIsGood?: boolean;
  label?: string;
  className?: string;
}

export function TrendBadge({
  changePercent,
  increaseIsGood = true,
  label = "vs last period",
  className,
}: TrendBadgeProps) {
  const isIncrease = changePercent >= 0;
  const isFavorable = isIncrease === increaseIsGood;
  const Icon = isIncrease ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isFavorable ? "text-income-600" : "text-expense-600",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span>
        {formatPercent(Math.abs(changePercent))} {label}
      </span>
    </span>
  );
}
