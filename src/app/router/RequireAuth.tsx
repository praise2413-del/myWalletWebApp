import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

function FullScreenLoader() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-primary-600" aria-hidden="true" />
    </div>
  );
}

export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export function RequireGuest() {
  const { session, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
