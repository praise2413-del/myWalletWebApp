import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { RequireAuth, RequireGuest } from "@/app/router/RequireAuth";
import { RequireBusiness } from "@/app/router/RequireBusiness";
import { RouteErrorBoundary } from "@/app/router/RouteErrorBoundary";

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const BusinessOnboardingPage = lazy(() => import("@/features/business/BusinessOnboardingPage"));
const BusinessDashboardPage = lazy(() => import("@/features/business/BusinessDashboardPage"));
const ChartOfAccountsPage = lazy(() => import("@/features/business/ChartOfAccountsPage"));
const JournalEntriesPage = lazy(() => import("@/features/business/JournalEntriesPage"));
const GeneralLedgerPage = lazy(() => import("@/features/business/GeneralLedgerPage"));
const BusinessStatementsPage = lazy(() => import("@/features/business/BusinessStatementsPage"));
const CustomersPage = lazy(() => import("@/features/business/CustomersPage"));
const SuppliersPage = lazy(() => import("@/features/business/SuppliersPage"));
const ProductsPage = lazy(() => import("@/features/business/ProductsPage"));
const SalesPage = lazy(() => import("@/features/business/SalesPage"));
const PurchasesPage = lazy(() => import("@/features/business/PurchasesPage"));
const BusinessInsightsPage = lazy(() => import("@/features/business/BusinessInsightsPage"));
const BusinessPlanningPage = lazy(() => import("@/features/business/BusinessPlanningPage"));
const BusinessForecastPage = lazy(() => import("@/features/business/BusinessForecastPage"));
const BusinessTeamPage = lazy(() => import("@/features/business/BusinessTeamPage"));
const BusinessSettingsPage = lazy(() => import("@/features/business/BusinessSettingsPage"));
const TransactionsPage = lazy(() => import("@/features/transactions/TransactionsPage"));
const ReportsPage = lazy(() => import("@/features/reports/ReportsPage"));
const InsightsPage = lazy(() => import("@/features/insights/InsightsPage"));
const CategoriesPage = lazy(() => import("@/features/categories/CategoriesPage"));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));
const MorePage = lazy(() => import("@/features/more/MorePage"));
const NotificationsPage = lazy(() => import("@/features/notifications/NotificationsPage"));
const NotificationDetailPage = lazy(() => import("@/features/notifications/NotificationDetailPage"));
const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/features/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/features/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/features/auth/ResetPasswordPage"));
const TermsPage = lazy(() => import("@/features/legal/TermsPage"));
const PrivacyPage = lazy(() => import("@/features/legal/PrivacyPage"));

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
    // Pathless root layout so one errorElement covers every route below —
    // React Router positions a real error boundary around each route's
    // output, so this also catches a lazy()-loaded chunk failing to
    // fetch (e.g. a stale deploy) even though these routes use plain
    // React.lazy()/Suspense rather than React Router's own lazy loader.
    element: <Outlet />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <RequireGuest />,
        children: [
          { path: "/login", element: withSuspense(<LoginPage />) },
          { path: "/register", element: withSuspense(<RegisterPage />) },
          { path: "/forgot-password", element: withSuspense(<ForgotPasswordPage />) },
        ],
      },
      { path: "/reset-password", element: withSuspense(<ResetPasswordPage />) },
      { path: "/terms", element: withSuspense(<TermsPage />) },
      { path: "/privacy", element: withSuspense(<PrivacyPage />) },
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
              { path: "/notifications", element: withSuspense(<NotificationsPage />) },
              { path: "/notifications/:id", element: withSuspense(<NotificationDetailPage />) },
              { path: "/business/onboarding", element: withSuspense(<BusinessOnboardingPage />) },
              {
                element: <RequireBusiness />,
                children: [
                  { path: "/business", element: withSuspense(<BusinessDashboardPage />) },
                  { path: "/business/accounts", element: withSuspense(<ChartOfAccountsPage />) },
                  { path: "/business/journal", element: withSuspense(<JournalEntriesPage />) },
                  { path: "/business/ledger", element: withSuspense(<GeneralLedgerPage />) },
                  { path: "/business/statements", element: withSuspense(<BusinessStatementsPage />) },
                  { path: "/business/customers", element: withSuspense(<CustomersPage />) },
                  { path: "/business/suppliers", element: withSuspense(<SuppliersPage />) },
                  { path: "/business/products", element: withSuspense(<ProductsPage />) },
                  { path: "/business/sales", element: withSuspense(<SalesPage />) },
                  { path: "/business/purchases", element: withSuspense(<PurchasesPage />) },
                  { path: "/business/insights", element: withSuspense(<BusinessInsightsPage />) },
                  { path: "/business/planning", element: withSuspense(<BusinessPlanningPage />) },
                  { path: "/business/forecast", element: withSuspense(<BusinessForecastPage />) },
                  { path: "/business/team", element: withSuspense(<BusinessTeamPage />) },
                  { path: "/business/settings", element: withSuspense(<BusinessSettingsPage />) },
                  { path: "/business/more", element: withSuspense(<MorePage />) },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
