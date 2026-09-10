import { Briefcase, Check, ChevronDown, Plus, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBusiness } from "@/hooks/useBusiness";
import { cn } from "@/lib/utils/cn";

interface WorkspaceSwitcherProps {
  isBusiness: boolean;
  onNavigate?: () => void;
}

/**
 * Personal / Business context switcher — the one navigation affordance
 * that's aware of both domains. Everything else (nav item lists, pages,
 * data hooks) stays split; this component is the seam between them.
 *
 * When in Business context, also owns the business picker — the only
 * place to switch between multiple owned businesses, or add another one.
 */
export function WorkspaceSwitcher({ isBusiness, onNavigate }: WorkspaceSwitcherProps) {
  const navigate = useNavigate();
  const { businesses, activeBusiness, loading, switchBusiness } = useBusiness();

  function goPersonal() {
    navigate("/");
    onNavigate?.();
  }

  function goBusiness() {
    navigate(activeBusiness ? "/business" : "/business/onboarding");
    onNavigate?.();
  }

  return (
    <div>
      <div className="flex rounded-lg bg-background p-1" role="tablist" aria-label="Workspace">
        <button
          type="button"
          role="tab"
          aria-selected={!isBusiness}
          onClick={goPersonal}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors",
            !isBusiness ? "bg-surface text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          <Wallet className="size-3.5" aria-hidden="true" />
          Personal
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isBusiness}
          disabled={loading}
          onClick={goBusiness}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
            isBusiness ? "bg-surface text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          <Briefcase className="size-3.5" aria-hidden="true" />
          Business
        </button>
      </div>

      {isBusiness && !loading && activeBusiness && (
        <BusinessPicker
          businesses={businesses}
          activeBusiness={activeBusiness}
          onSwitch={(id) => {
            switchBusiness(id);
            navigate("/business");
            onNavigate?.();
          }}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

function BusinessPicker({
  businesses,
  activeBusiness,
  onSwitch,
  onNavigate,
}: {
  businesses: { id: string; name: string }[];
  activeBusiness: { id: string; name: string };
  onSwitch: (id: string) => void;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border-strong px-2.5 py-2 text-left transition-colors hover:bg-background"
      >
        <span className="truncate text-sm font-medium text-text-primary">{activeBusiness.name}</span>
        <ChevronDown className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />
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
            className="absolute left-0 right-0 z-20 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-border bg-surface-elevated py-1 shadow-[var(--shadow-popover)]"
          >
            {businesses.map((business) => (
              <button
                key={business.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSwitch(business.id);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
              >
                <span className="truncate">{business.name}</span>
                {business.id === activeBusiness.id && <Check className="size-4 shrink-0 text-primary-600" aria-hidden="true" />}
              </button>
            ))}
            <div className="my-1 border-t border-border" />
            <Link
              to="/business/onboarding?add=1"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-background dark:text-primary-500"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add Business
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
