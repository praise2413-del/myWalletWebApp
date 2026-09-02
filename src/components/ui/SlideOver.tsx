import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { cn } from "@/lib/utils/cn";

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SlideOver({ open, onClose, title, description, children }: SlideOverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, containerRef);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slide-over-title"
        // `inert` keeps this panel's contents out of the tab order while closed — it stays
        // mounted (for the slide-out transition), so aria-hidden alone isn't enough to stop
        // a sighted keyboard user tabbing into hidden fields.
        inert={!open ? true : undefined}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-surface-elevated shadow-[var(--shadow-popover)] transition-transform duration-200 focus:outline-none",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div>
            <h2 id="slide-over-title" className="text-lg font-semibold text-text-primary">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
