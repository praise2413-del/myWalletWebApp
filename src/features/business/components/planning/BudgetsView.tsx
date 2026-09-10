import { Pencil, Plus, Trash2, Wallet2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { BudgetFormModal } from "@/features/business/components/BudgetFormModal";
import { useBudgets } from "@/features/business/hooks/useBudgets";
import { useChartOfAccounts } from "@/features/business/hooks/useChartOfAccounts";
import type { RawLedgerLine } from "@/features/business/lib/statements";
import { useBusiness } from "@/hooks/useBusiness";
import { useToastStore } from "@/hooks/useToastStore";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { friendlyDbError } from "@/lib/utils/dbErrors";
import { toDateKey } from "@/lib/utils/period";
import type { BudgetFormInput } from "@/lib/validations/budget";
import type { Budget } from "@/types";

function monthLabel(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function actualFor(lines: RawLedgerLine[], accountId: string, month: number, year: number): number {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const to = toDateKey(new Date(year, month, 0)); // last day of month, timezone-safe
  return lines
    .filter((l) => l.accountId === accountId && l.entryDate >= from && l.entryDate <= to)
    .reduce((sum, l) => sum + l.debit - l.credit, 0);
}

export function BudgetsView({ lines, loading: linesLoading }: { lines: RawLedgerLine[]; loading: boolean }) {
  const { activeBusiness } = useBusiness();
  const currency = activeBusiness?.currency ?? "TZS";
  const showToast = useToastStore((state) => state.showToast);
  const { accounts } = useChartOfAccounts();
  const expenseAccounts = useMemo(() => accounts.filter((a) => a.type === "EXPENSE"), [accounts]);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { budgets, loading, error, refresh } = useBudgets(month, year);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);

  const handleSubmit = async (values: BudgetFormInput) => {
    if (!activeBusiness) return { error: "No active business." };
    const payload = { business_id: activeBusiness.id, account_id: values.accountId, month, year, amount: values.amount };
    const { error: submitError } = editing
      ? await supabase.from("budgets").update({ amount: values.amount }).eq("id", editing.id)
      : await supabase.from("budgets").insert(payload);
    if (submitError) return { error: friendlyDbError(submitError.message, "We couldn't save this budget.") };
    await refresh();
    showToast(editing ? "Budget updated." : "Budget added.");
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error: deleteError } = await supabase.from("budgets").delete().eq("id", deleting.id);
    setDeleting(null);
    if (deleteError) {
      showToast("We couldn't delete this budget.", "error");
      return;
    }
    await refresh();
    showToast("Budget deleted.");
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
            aria-label="Month"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1, 1).toLocaleDateString("en-US", { month: "long" })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label="Year"
            className="h-9 w-24 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
          />
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="size-4" aria-hidden="true" />
          Add Budget
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-expense-600">{error}</p>
      ) : loading || linesLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : budgets.length === 0 ? (
        <EmptyState icon={Wallet2} title="No budgets set for this month" description={`Set a spending budget per expense account for ${monthLabel(month, year)}.`} />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {budgets.map((b) => {
            const actual = actualFor(lines, b.accountId, month, year);
            const percent = b.amount > 0 ? Math.min(100, (actual / b.amount) * 100) : actual > 0 ? 100 : 0;
            const over = actual > b.amount;
            return (
              <div key={b.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{b.accountName}</p>
                    <p className="text-xs text-text-tertiary">
                      {formatCurrency(actual, currency)} of {formatCurrency(b.amount, currency)}
                      {over && " · Over budget"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => { setEditing(b); setFormOpen(true); }} aria-label={`Edit ${b.accountName} budget`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary">
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => setDeleting(b)} aria-label={`Delete ${b.accountName} budget`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-expense-50 hover:text-expense-600">
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-background">
                  <div
                    className={cn("h-full rounded-full transition-all", over ? "bg-expense-500" : "bg-primary-500")}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <BudgetFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        expenseAccounts={expenseAccounts}
        existingAccountIds={budgets.map((b) => b.accountId)}
        editingBudget={editing}
        periodLabel={monthLabel(month, year)}
        currency={currency}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete budget?"
        description={`This will remove the ${monthLabel(month, year)} budget for ${deleting?.accountName ?? "this account"}.`}
      />
    </div>
  );
}
