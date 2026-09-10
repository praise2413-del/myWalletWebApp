import { ArrowRight, Banknote, BookText, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useBusiness } from "@/hooks/useBusiness";
import { ACCOUNTING_BASIS_OPTIONS, BUSINESS_TYPE_OPTIONS } from "@/lib/validations/business";

function labelFor(options: readonly { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

/**
 * Deliberately separate from the shared `StatCard` (which always renders a
 * currency amount + trend badge) — these are honest "not built yet"
 * placeholders, not real figures, so they shouldn't borrow a component
 * whose contract implies a real computed number.
 */
function ComingSoonStat({ label }: { label: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-text-tertiary">—</p>
      <p className="mt-2 text-xs text-text-tertiary">Coming soon</p>
    </Card>
  );
}

export default function BusinessDashboardPage() {
  const { activeBusiness } = useBusiness();

  if (!activeBusiness) return null; // RequireBusiness redirects before this can render.

  return (
    <div>
      <PageHeader
        title={activeBusiness.name}
        description="Business Dashboard"
        actions={<Badge tone="primary">{labelFor(BUSINESS_TYPE_OPTIONS, activeBusiness.businessType)}</Badge>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ComingSoonStat label="Revenue" />
        <ComingSoonStat label="Expenses" />
        <ComingSoonStat label="Net Profit" />
        <ComingSoonStat label="Cash Position" />
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
            <CardTitle>Get Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-text-secondary">
              Your starter chart of accounts is ready. Recording sales, purchases, and expenses — plus
              full financial statements — is coming in the next phase of Business Finance.
            </p>
            <Link
              to="/business/accounts"
              className="flex items-center justify-between rounded-lg border border-border-strong px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-background"
            >
              <span className="flex items-center gap-2">
                <BookText className="size-4 text-text-secondary" aria-hidden="true" />
                View Chart of Accounts
              </span>
              <ArrowRight className="size-4 text-text-tertiary" aria-hidden="true" />
            </Link>
            <div className="flex items-center gap-2 rounded-lg bg-background px-4 py-3 text-xs text-text-tertiary">
              <TrendingUp className="size-4 shrink-0" aria-hidden="true" />
              Revenue, expenses, receivables, payables, and reports unlock once transactions can be
              recorded.
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-background px-4 py-3 text-xs text-text-tertiary">
              <Banknote className="size-4 shrink-0" aria-hidden="true" />
              This is an early, foundation-only release of Business Finance — more is on the way.
            </div>
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
