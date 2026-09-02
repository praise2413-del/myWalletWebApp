import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div>
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text-secondary">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={cn(
            "h-10 w-full rounded-lg border bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30",
            error ? "border-expense-500" : "border-border-strong focus:border-primary-500",
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} className="mt-1.5 text-xs text-expense-600">
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-text-tertiary">{hint}</p>
        ) : null}
      </div>
    );
  },
);
TextField.displayName = "TextField";
