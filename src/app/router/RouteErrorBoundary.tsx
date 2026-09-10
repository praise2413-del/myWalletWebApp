import { AlertTriangle, RefreshCw } from "lucide-react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";

/**
 * A lazy-loaded route chunk (JS file, hashed per deploy) can 404 if the
 * user has this tab open from before a new deploy replaced the old
 * hashes — their bundle still points at files that no longer exist.
 * Browsers phrase this differently ("Failed to fetch dynamically
 * imported module", "error loading dynamically imported module",
 * "Importing a module script failed"), so match broadly rather than one
 * exact string. This is never a real app bug — it's always fixed by a
 * reload, which is why it gets its own message steering straight at
 * that instead of the generic fallback below.
 */
function isStaleDeployChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|importing a module script failed|loading chunk|loading css chunk/i.test(message);
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  // eslint-disable-next-line no-console
  console.error("Route error:", error);

  const staleDeploy = isStaleDeployChunkError(error);
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  const title = staleDeploy ? "myWallet was just updated" : notFound ? "Page not found" : "Something went wrong";

  const description = staleDeploy
    ? "This page changed since you opened it. Refreshing will load the latest version — your data is safe."
    : notFound
      ? "The page you're looking for doesn't exist or may have moved."
      : "We hit an unexpected problem loading this page. Refreshing usually fixes it.";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <Logo />

      <div className="flex size-12 items-center justify-center rounded-full bg-warning-50">
        <AlertTriangle className="size-6 text-warning-600" aria-hidden="true" />
      </div>

      <div className="max-w-sm space-y-1.5">
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Refresh Page
        </Button>
        {!staleDeploy && (
          <Button variant="outline" onClick={() => navigate("/")}>
            Go to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
