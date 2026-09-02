import { Eye, EyeOff } from "lucide-react";
import { type InputHTMLAttributes, forwardRef, useId, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div>
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text-secondary">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            className={cn(
              "h-10 w-full rounded-lg border bg-surface pl-3 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30",
              error ? "border-expense-500" : "border-border-strong focus:border-primary-500",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-text-tertiary hover:text-text-secondary"
          >
            {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-expense-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);
PasswordField.displayName = "PasswordField";
