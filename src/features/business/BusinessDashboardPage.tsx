import { ArrowRight, BookOpen, FileBarChart, FileText, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { useBusinessDashboardData } from "@/features/business/hooks/useBusinessDashboardData";
import { useBusiness } from "@/hooks/useBusiness";
import { ACCOUNTING_BASIS_OPTIONS, businessTypeLabel } from "@/lib/validations/business";

function labelFor(options: readonly { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export default function BusinessDashboardPage() {
  const { activeBusiness } = useBusiness();
  const { summary, loading, error } = useBusinessDashboardData();

  if (!activeBusiness) return null; // RequireBusiness redirects before this can render.

  return (
    <div>
      <PageHeader
        title={activeBusiness.name}
        description="Business Dashboard · This Month"
        actions={<Badge tone="primary">{businessTypeLabel(activeBusiness)}</Badge>}
      />

      {error && (
        <div className="mb-4">
          <AlertBanner message={error} />
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : (
          <>
            <StatCard label="Revenue" amount={summary.revenue} currency={activeBusiness.currency} changePercent={summary.deltas.revenue} />
            <StatCard
              label="Expenses"
              amount={summary.expenses}
              currency={activeBusiness.currency}
              changePercent={summary.deltas.expenses}
              increaseIsGood={false}
            />
            <StatCard
              label="Net Profit"
              amount={summary.netProfit}
              currency={activeBusiness.currency}
              changePercent={summary.deltas.netProfit}
            />
            <StatCard
              label="Cash Position"
              amount={summary.cashPosition}
              currency={activeBusiness.currency}
              changePercent={summary.deltas.cashPosition}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Industry" value={activeBusiness.industry || "Not set"} />
            <DetailRow label="Currency" value={activeBusiness.currency} />
            <DetailRow
              label="Accounting Basis"
              value={labelFor(ACCOUNTING_BASIS_OPTIONS, activeBusiness.accountingBasis)}
            />
            <DetailRow
              label="Financial Year Starts"
              value={new Date(2000, activeBusiness.financialYearStartMonth - 1, 1).toLocaleString(undefined, {
                month: "long",
              })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink to="/business/sales" icon={FileText} label="New Sale Invoice" />
            <QuickLink to="/business/purchases" icon={Receipt} label="New Purchase Bill" />
            <QuickLink to="/business/journal" icon={BookOpen} label="New Journal Entry" />
            <QuickLink to="/business/statements" icon={FileBarChart} label="View Financial Statements" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-tertiary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: typeof FileText; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg border border-border-strong px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-background"
    >
      <span className="flex items-center gap-2">
        <Icon className="size-4 text-text-secondary" aria-hidden="true" />
        {label}
      </span>
      <ArrowRight className="size-4 text-text-tertiary" aria-hidden="true" />
    </Link>
  );
}
