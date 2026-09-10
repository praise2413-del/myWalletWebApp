import { Briefcase, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
 */
export function WorkspaceSwitcher({ isBusiness, onNavigate }: WorkspaceSwitcherProps) {
  const navigate = useNavigate();
  const { activeBusiness, loading } = useBusiness();

  function goPersonal() {
    navigate("/");
    onNavigate?.();
  }

  function goBusiness() {
    navigate(activeBusiness ? "/business" : "/business/onboarding");
    onNavigate?.();
  }

  return (
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
  );
}
