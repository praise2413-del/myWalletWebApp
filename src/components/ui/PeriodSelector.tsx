import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface PeriodSelectorProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function PeriodSelector({ options, value, onChange }: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-background"
      >
        {value}
        <ChevronDown className="size-4 text-text-tertiary" aria-hidden="true" />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-[var(--shadow-popover)]"
          >
            {options.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors",
                    value === option
                      ? "text-primary-700 dark:text-primary-500"
                      : "text-text-secondary hover:bg-background hover:text-text-primary",
                  )}
                >
                  {option}
                  {value === option && <Check className="size-4" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
