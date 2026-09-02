import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { RequireAuth, RequireGuest } from "@/app/router/RequireAuth";

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const TransactionsPage = lazy(() => import("@/features/transactions/TransactionsPage"));
const ReportsPage = lazy(() => import("@/features/reports/ReportsPage"));
const InsightsPage = lazy(() => import("@/features/insights/InsightsPage"));
const CategoriesPage = lazy(() => import("@/features/categories/CategoriesPage"));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));
const MorePage = lazy(() => import("@/features/more/MorePage"));
const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/features/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/features/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/features/auth/ResetPasswordPage"));

function RouteFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    element: <RequireGuest />,
    children: [
      { path: "/login", element: withSuspense(<LoginPage />) },
      { path: "/register", element: withSuspense(<RegisterPage />) },
      { path: "/forgot-password", element: withSuspense(<ForgotPasswordPage />) },
    ],
  },
  { path: "/reset-password", element: withSuspense(<ResetPasswordPage />) },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: withSuspense(<DashboardPage />) },
          { path: "/transactions", element: withSuspense(<TransactionsPage />) },
          { path: "/reports", element: withSuspense(<ReportsPage />) },
          { path: "/insights", element: withSuspense(<InsightsPage />) },
          { path: "/categories", element: withSuspense(<CategoriesPage />) },
          { path: "/settings", element: withSuspense(<SettingsPage />) },
          { path: "/more", element: withSuspense(<MorePage />) },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
