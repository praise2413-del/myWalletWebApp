import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { Field, inputClass } from "@/features/business/components/formFields";
import { todayDateKey } from "@/lib/utils/period";
import { type BusinessGoalFormInput, businessGoalFormSchema, GOAL_TYPE_OPTIONS } from "@/lib/validations/businessGoal";
import type { BusinessGoal } from "@/types";

interface BusinessGoalFormModalProps {
  open: boolean;
  onClose: () => void;
  currency: string;
  editingGoal?: BusinessGoal | null;
  onSubmit: (values: BusinessGoalFormInput) => Promise<{ error?: string } | void>;
}

const today = todayDateKey;

const EMPTY: BusinessGoalFormInput = { name: "", goalType: "REVENUE", targetAmount: 0, startDate: today(), targetDate: "", notes: "" };

export function BusinessGoalFormModal({ open, onClose, currency, editingGoal, onSubmit }: BusinessGoalFormModalProps) {
  const isEditing = Boolean(editingGoal);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BusinessGoalFormInput>({ resolver: zodResolver(businessGoalFormSchema), defaultValues: EMPTY });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    reset(
      editingGoal
        ? {
            name: editingGoal.name,
            goalType: editingGoal.goalType,
            targetAmount: editingGoal.targetAmount,
            startDate: editingGoal.startDate,
            targetDate: editingGoal.targetDate ?? "",
            notes: editingGoal.notes,
          }
        : EMPTY,
    );
  }, [open, editingGoal, reset]);

  const goalType = watch("goalType");
  const hint = GOAL_TYPE_OPTIONS.find((o) => o.value === goalType)?.hint;

  return (
    <SlideOver open={open} onClose={onClose} title={isEditing ? "Edit Goal" : "New Goal"} description="Progress is always tracked live from your posted journal — never entered by hand">
      <form
        onSubmit={handleSubmit(async (values) => {
          setSubmitError(null);
          const result = await onSubmit(values);
          if (result?.error) setSubmitError(result.error);
          else onClose();
        })}
        noValidate
        className="flex h-full flex-col"
      >
        <div className="flex-1 space-y-5">
          {submitError && <AlertBanner message={submitError} />}

          <Field id="goal-name" label="Goal Name" error={errors.name?.message}>
            <input id="goal-name" placeholder="e.g. Q4 Revenue Push" className={inputClass(Boolean(errors.name))} {...register("name")} />
          </Field>

          <Field id="goal-type" label="Goal Type" error={errors.goalType?.message}>
            <select id="goal-type" className={inputClass(Boolean(errors.goalType))} {...register("goalType")}>
              {GOAL_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {hint && <p className="mt-1.5 text-xs text-text-tertiary">{hint}</p>}
          </Field>

          <Field id="goal-target" label={`Target Amount (${currency})`} error={errors.targetAmount?.message}>
            <input id="goal-target" type="number" step="0.01" min="0" className={inputClass(Boolean(errors.targetAmount))} {...register("targetAmount", { valueAsNumber: true })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field id="goal-start" label="Start Date" error={errors.startDate?.message}>
              <input id="goal-start" type="date" max={today()} className={inputClass(Boolean(errors.startDate))} {...register("startDate")} />
            </Field>
            <Field id="goal-target-date" label="Target Date" optional>
              <input id="goal-target-date" type="date" className={inputClass(false)} {...register("targetDate")} />
            </Field>
          </div>

          <Field id="goal-notes" label="Notes" optional>
            <textarea id="goal-notes" rows={3} className="w-full resize-none rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none" {...register("notes")} />
          </Field>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Goal"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
