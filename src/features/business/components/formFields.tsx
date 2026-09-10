import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function inputClass(hasError: boolean): string {
  return cn(
    "h-10 w-full rounded-lg border bg-surface px-3 text-sm text-text-primary focus:outline-none",
    hasError ? "border-expense-500" : "border-border-strong focus:border-primary-500",
  );
}

export function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text-secondary">
        {label} {optional && <span className="text-text-tertiary">(Optional)</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-expense-600">{error}</p>}
    </div>
  );
}
