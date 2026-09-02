import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { type ThemeMode, useThemeStore } from "@/hooks/useThemeStore";
import { cn } from "@/lib/utils/cn";

const OPTIONS: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: "light", icon: Sun, label: "Light theme" },
  { mode: "dark", icon: Moon, label: "Dark theme" },
  { mode: "system", icon: Monitor, label: "System theme" },
];

export function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const [open, setOpen] = useState(false);
  const Current = OPTIONS.find((o) => o.mode === mode)?.icon ?? Monitor;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
      >
        <Current className="size-[18px]" aria-hidden="true" />
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
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-[var(--shadow-popover)]"
          >
            {OPTIONS.map((option) => (
              <button
                key={option.mode}
                type="button"
                role="menuitemradio"
                aria-checked={mode === option.mode}
                onClick={() => {
                  setMode(option.mode);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  mode === option.mode
                    ? "bg-primary-50 text-primary-700 dark:text-primary-500"
                    : "text-text-secondary hover:bg-background hover:text-text-primary",
                )}
              >
                <option.icon className="size-4" aria-hidden="true" />
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
