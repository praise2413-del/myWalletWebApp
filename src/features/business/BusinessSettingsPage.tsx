import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DeleteBusinessDialog } from "@/features/business/components/DeleteBusinessDialog";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { useToastStore } from "@/hooks/useToastStore";
import { ACCOUNTING_BASIS_OPTIONS, businessTypeLabel } from "@/lib/validations/business";

function labelFor(options: readonly { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export default function BusinessSettingsPage() {
  const { user } = useAuth();
  const { activeBusiness, deleteBusiness } = useBusiness();
  const showToast = useToastStore((state) => state.showToast);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!activeBusiness) return null; // RequireBusiness redirects before this can render.

  const isOwner = user?.id === activeBusiness.ownerId;

  const handleDelete = async () => {
    const result = await deleteBusiness(activeBusiness.id);
    if (result?.error) return result;
    setDeleteOpen(false);
    showToast("Business deleted.");
  };

  return (
    <div>
      <PageHeader title="Business Settings" description="Details for this business, and where to delete it if it's no longer active." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Name" value={activeBusiness.name} />
            <DetailRow label="Type" value={businessTypeLabel(activeBusiness)} />
            <DetailRow label="Industry" value={activeBusiness.industry || "Not set"} />
            <DetailRow label="Currency" value={activeBusiness.currency} />
            <DetailRow label="Accounting Basis" value={labelFor(ACCOUNTING_BASIS_OPTIONS, activeBusiness.accountingBasis)} />
            <DetailRow
              label="Financial Year Starts"
              value={new Date(2000, activeBusiness.financialYearStartMonth - 1, 1).toLocaleString(undefined, { month: "long" })}
            />
          </CardContent>
        </Card>

        {isOwner ? (
          <Card className="border-expense-200 dark:border-expense-500/30">
            <CardHeader>
              <CardTitle className="text-expense-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 rounded-lg bg-expense-50 p-3 dark:bg-expense-500/10">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-expense-600" aria-hidden="true" />
                <p className="text-xs text-text-secondary">
                  Deleting this business permanently removes its chart of accounts, journal, sales, purchases,
                  budgets, goals, and team access. This can't be undone. Your other businesses and your myWallet
                  account are never affected.
                </p>
              </div>
              <Button variant="danger" size="sm" className="mt-3" onClick={() => setDeleteOpen(true)}>
                Delete This Business
              </Button>
            </CardContent>
          </Card>
        ) : (
          <p className="text-xs text-text-tertiary">Only the business owner can delete this business.</p>
        )}
      </div>

      <DeleteBusinessDialog
        open={deleteOpen}
        businessName={activeBusiness.name}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
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
