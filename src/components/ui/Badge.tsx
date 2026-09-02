import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone = "neutral" | "income" | "expense" | "warning" | "primary";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-background text-text-secondary border-border",
  income: "bg-income-50 text-income-600 border-transparent",
  expense: "bg-expense-50 text-expense-600 border-transparent",
  warning: "bg-warning-50 text-warning-700 border-transparent",
  primary: "bg-primary-50 text-primary-700 border-transparent dark:text-primary-500",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
