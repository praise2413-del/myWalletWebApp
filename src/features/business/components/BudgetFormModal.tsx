import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass } from "@/features/business/components/formFields";
import { type BudgetFormInput, budgetFormSchema } from "@/lib/validations/budget";
import type { Budget, BusinessAccount } from "@/types";

interface BudgetFormModalProps {
  open: boolean;
  onClose: () => void;
  expenseAccounts: BusinessAccount[];
  existingAccountIds: string[];
  editingBudget?: Budget | null;
  periodLabel: string;
  currency: string;
  onSubmit: (values: BudgetFormInput) => Promise<{ error?: string } | void>;
}

export function BudgetFormModal({ open, onClose, expenseAccounts, existingAccountIds, editingBudget, periodLabel, currency, onSubmit }: BudgetFormModalProps) {
  const isEditing = Boolean(editingBudget);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormInput>({ resolver: zodResolver(budgetFormSchema), defaultValues: { accountId: "", amount: 0 } });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    reset(editingBudget ? { accountId: editingBudget.accountId, amount: editingBudget.amount } : { accountId: "", amount: 0 });
  }, [open, editingBudget, reset]);

  const availableAccounts = editingBudget
    ? expenseAccounts
    : expenseAccounts.filter((a) => !existingAccountIds.includes(a.id));

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Budget" : "Add Budget"} description={periodLabel}>
      <form
        onSubmit={handleSubmit(async (values) => {
          setSubmitError(null);
          const result = await onSubmit(values);
          if (result?.error) setSubmitError(result.error);
          else onClose();
        })}
        noValidate
        className="space-y-4"
      >
        {submitError && <AlertBanner message={submitError} />}

        <Field id="budget-account" label="Expense Account" error={errors.accountId?.message}>
          <select id="budget-account" className={inputClass(Boolean(errors.accountId))} disabled={isEditing} {...register("accountId")}>
            <option value="">Select account</option>
            {availableAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="budget-amount" label={`Budgeted Amount (${currency})`} error={errors.amount?.message}>
          <input id="budget-amount" type="number" step="0.01" min="0" className={inputClass(Boolean(errors.amount))} {...register("amount", { valueAsNumber: true })} />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Budget"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
