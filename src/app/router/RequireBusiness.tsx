import { Loader2 } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";
import { useBusiness } from "@/hooks/useBusiness";

/**
 * Guards every /business/* route except onboarding itself: if the user has
 * no active business yet, send them to onboarding instead of a broken/empty
 * business page.
 */
export function RequireBusiness() {
  const { activeBusiness, loading } = useBusiness();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary-600" aria-hidden="true" />
      </div>
    );
  }

  if (!activeBusiness) {
    return <Navigate to="/business/onboarding" replace />;
  }

  return <Outlet />;
}
