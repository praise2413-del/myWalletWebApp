import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { BusinessGoalFormModal } from "@/features/business/components/BusinessGoalFormModal";
import { useBusinessGoals } from "@/features/business/hooks/useBusinessGoals";
import { buildGoalProgress } from "@/features/business/lib/goalProgress";
import type { RawLedgerLine } from "@/features/business/lib/statements";
import { useBusiness } from "@/hooks/useBusiness";
import { useToastStore } from "@/hooks/useToastStore";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { todayDateKey } from "@/lib/utils/period";
import { GOAL_TYPE_OPTIONS, type BusinessGoalFormInput } from "@/lib/validations/businessGoal";
import type { BusinessGoal } from "@/types";

const today = todayDateKey;

function typeLabel(goalType: BusinessGoal["goalType"]): string {
  return GOAL_TYPE_OPTIONS.find((o) => o.value === goalType)?.label ?? goalType;
}

export function GoalsView({ lines, loading: linesLoading }: { lines: RawLedgerLine[]; loading: boolean }) {
  const { activeBusiness } = useBusiness();
  const currency = activeBusiness?.currency ?? "TZS";
  const showToast = useToastStore((state) => state.showToast);
  const { goals, loading, error, refresh } = useBusinessGoals();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessGoal | null>(null);
  const [deleting, setDeleting] = useState<BusinessGoal | null>(null);

  const handleSubmit = async (values: BusinessGoalFormInput) => {
    if (!activeBusiness) return { error: "No active business." };
    const payload = {
      business_id: activeBusiness.id,
      name: values.name,
      goal_type: values.goalType,
      target_amount: values.targetAmount,
      start_date: values.startDate,
      target_date: values.targetDate || null,
      notes: values.notes,
    };
    const { error: submitError } = editing
      ? await supabase.from("business_goals").update(payload).eq("id", editing.id)
      : await supabase.from("business_goals").insert(payload);
    if (submitError) return { error: "We couldn't save this goal." };
    await refresh();
    showToast(editing ? "Goal updated." : "Goal created.");
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error: deleteError } = await supabase.from("business_goals").delete().eq("id", deleting.id);
    setDeleting(null);
    if (deleteError) {
      showToast("We couldn't delete this goal.", "error");
      return;
    }
    await refresh();
    showToast("Goal deleted.");
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="size-4" aria-hidden="true" />
          New Goal
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-expense-600">{error}</p>
      ) : loading || linesLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set a revenue, net profit, or cash reserve target — progress is tracked live from your books." action={<Button size="sm" onClick={() => setFormOpen(true)}><Plus className="size-4" aria-hidden="true" />New Goal</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const progress = buildGoalProgress(goal, lines, today());
            return (
              <Card key={goal.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{goal.name}</p>
                    <Badge tone="primary" className="mt-1">{typeLabel(goal.goalType)}</Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => { setEditing(goal); setFormOpen(true); }} aria-label={`Edit ${goal.name}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary">
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => setDeleting(goal)} aria-label={`Delete ${goal.name}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-expense-50 hover:text-expense-600">
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-2xl font-bold tracking-tight text-text-primary">{formatCurrency(progress.currentValue, currency)}</p>
                <p className="text-xs text-text-tertiary">of {formatCurrency(goal.targetAmount, currency)} target</p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                  <div className={cn("h-full rounded-full transition-all", progress.isAchieved ? "bg-income-500" : "bg-primary-500")} style={{ width: `${progress.percent}%` }} />
                </div>
                {progress.isAchieved && <Badge tone="income" className="mt-2">Achieved</Badge>}
              </Card>
            );
          })}
        </div>
      )}

      <BusinessGoalFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} currency={currency} editingGoal={editing} onSubmit={handleSubmit} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete goal?"
        description={`This will permanently delete "${deleting?.name ?? "this goal"}".`}
      />
    </div>
  );
}
