import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { cn } from "@/lib/utils/cn";
import {
  type TransactionFormInput,
  transactionFormSchema,
} from "@/lib/validations/transaction";
import type { Category, Transaction, TransactionType } from "@/types";

interface TransactionFormModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  currency: string;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  onSubmit: (values: TransactionFormInput) => Promise<{ error?: string } | void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionFormModal({
  open,
  onClose,
  categories,
  currency,
  initialType = "EXPENSE",
  editingTransaction,
  onSubmit,
}: TransactionFormModalProps) {
  const isEditing = Boolean(editingTransaction);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: initialType,
      amount: undefined,
      categoryId: "",
      transactionDate: today(),
      note: "",
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    if (editingTransaction) {
      reset({
        type: editingTransaction.type,
        amount: editingTransaction.amount,
        categoryId: editingTransaction.categoryId,
        transactionDate: editingTransaction.transactionDate,
        note: editingTransaction.note ?? "",
      });
    } else {
      reset({ type: initialType, amount: undefined, categoryId: "", transactionDate: today(), note: "" });
    }
  }, [open, editingTransaction, initialType, reset]);

  const type = watch("type");
  const categoryOptions = categories.filter((c) => c.type === type);

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Transaction" : "Add Transaction"}
      description="Record a new income or expense"
    >
      <form
        onSubmit={handleSubmit(async (values) => {
          setSubmitError(null);
          const result = await onSubmit(values);
          if (result?.error) {
            setSubmitError(result.error);
          } else {
            onClose();
          }
        })}
        noValidate
        className="flex h-full flex-col"
      >
        <div className="flex-1 space-y-5">
          {submitError && <AlertBanner message={submitError} />}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setValue("type", "INCOME");
                setValue("categoryId", "");
              }}
              className={cn(
                "flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors",
                type === "INCOME"
                  ? "border-transparent bg-income-500 text-white"
                  : "border-border-strong text-text-secondary hover:bg-background",
              )}
            >
              + Income
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("type", "EXPENSE");
                setValue("categoryId", "");
              }}
              className={cn(
                "flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors",
                type === "EXPENSE"
                  ? "border-transparent bg-expense-500 text-white"
                  : "border-border-strong text-text-secondary hover:bg-background",
              )}
            >
              ✕ Expense
            </button>
          </div>

          <div>
            <label htmlFor="tx-amount" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
                {currency}
              </span>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                aria-invalid={Boolean(errors.amount)}
                className={cn(
                  "h-11 w-full rounded-lg border bg-surface pl-14 pr-3 text-base font-semibold text-text-primary focus:outline-none",
                  errors.amount ? "border-expense-500" : "border-border-strong focus:border-primary-500",
                )}
                {...register("amount", { valueAsNumber: true })}
              />
            </div>
            {errors.amount && <p className="mt-1.5 text-xs text-expense-600">{errors.amount.message}</p>}
          </div>

          <div>
            <label htmlFor="tx-category" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Category
            </label>
            <select
              id="tx-category"
              aria-invalid={Boolean(errors.categoryId)}
              className={cn(
                "h-10 w-full rounded-lg border bg-surface px-3 text-sm text-text-primary focus:outline-none",
                errors.categoryId ? "border-expense-500" : "border-border-strong focus:border-primary-500",
              )}
              {...register("categoryId")}
            >
              <option value="">Select category</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1.5 text-xs text-expense-600">{errors.categoryId.message}</p>}
          </div>

          <div>
            <label htmlFor="tx-date" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Date
            </label>
            <input
              id="tx-date"
              type="date"
              max={today()}
              aria-invalid={Boolean(errors.transactionDate)}
              className={cn(
                "h-10 w-full rounded-lg border bg-surface px-3 text-sm text-text-primary focus:outline-none",
                errors.transactionDate ? "border-expense-500" : "border-border-strong focus:border-primary-500",
              )}
              {...register("transactionDate")}
            />
            {errors.transactionDate && (
              <p className="mt-1.5 text-xs text-expense-600">{errors.transactionDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="tx-note" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Note <span className="text-text-tertiary">(Optional)</span>
            </label>
            <textarea
              id="tx-note"
              rows={3}
              placeholder="Write a note..."
              className="w-full resize-none rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
              {...register("note")}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Transaction"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
