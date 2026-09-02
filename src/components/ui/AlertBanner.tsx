import { AlertTriangle } from "lucide-react";

export function AlertBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-expense-200 bg-expense-50 px-3 py-2.5 text-sm text-expense-700 dark:border-transparent dark:text-expense-500"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
