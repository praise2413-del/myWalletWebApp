import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Logo } from "@/components/layout/Logo";
import { BUSINESS_NAV_ITEMS, NAV_ITEMS } from "@/components/layout/navItems";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { cn } from "@/lib/utils/cn";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, containerRef);
  const isBusiness = useLocation().pathname.startsWith("/business");
  const items = isBusiness ? BUSINESS_NAV_ITEMS : NAV_ITEMS;

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close navigation menu"
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
        aria-label="Navigation menu"
        inert={!open ? true : undefined}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col bg-surface transition-transform duration-200 focus:outline-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-background"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="px-3 pt-3">
          <WorkspaceSwitcher isBusiness={isBusiness} onNavigate={onClose} />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-600 text-white shadow-sm dark:border-primary-500/30 dark:bg-primary-500/15 dark:text-primary-400 dark:shadow-none"
                    : "text-text-secondary hover:bg-background hover:text-text-primary",
                )
              }
            >
              <item.icon className="size-[18px] shrink-0" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
