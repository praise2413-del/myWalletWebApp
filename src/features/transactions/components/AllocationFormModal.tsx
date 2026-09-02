import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { cn } from "@/lib/utils/cn";
import { type AllocationFormInput, allocationFormSchema } from "@/lib/validations/transaction";
import type { Allocation, AllocationType } from "@/types";

interface AllocationFormModalProps {
  open: boolean;
  onClose: () => void;
  currency: string;
  initialType?: AllocationType;
  editingAllocation?: Allocation | null;
  onSubmit: (values: AllocationFormInput) => Promise<{ error?: string } | void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AllocationFormModal({
  open,
  onClose,
  currency,
  initialType = "SAVING",
  editingAllocation,
  onSubmit,
}: AllocationFormModalProps) {
  const isEditing = Boolean(editingAllocation);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AllocationFormInput>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      type: initialType,
      amount: undefined,
      allocationDate: today(),
      note: "",
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    if (editingAllocation) {
      reset({
        type: editingAllocation.type,
        amount: editingAllocation.amount,
        allocationDate: editingAllocation.allocationDate,
        note: editingAllocation.note ?? "",
      });
    } else {
      reset({ type: initialType, amount: undefined, allocationDate: today(), note: "" });
    }
  }, [open, editingAllocation, initialType, reset]);

  const type = watch("type");

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Allocation" : "Add Savings or Investment"}
      description="Money you're deliberately setting aside — kept separate from your expenses"
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
              onClick={() => setValue("type", "SAVING")}
              className={cn(
                "flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors",
                type === "SAVING"
                  ? "border-transparent bg-primary-600 text-white"
                  : "border-border-strong text-text-secondary hover:bg-background",
              )}
            >
              Saving
            </button>
            <button
              type="button"
              onClick={() => setValue("type", "INVESTMENT")}
              className={cn(
                "flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors",
                type === "INVESTMENT"
                  ? "border-transparent bg-primary-600 text-white"
                  : "border-border-strong text-text-secondary hover:bg-background",
              )}
            >
              Investment
            </button>
          </div>

          <div>
            <label htmlFor="alloc-amount" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
                {currency}
              </span>
              <input
                id="alloc-amount"
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
            <label htmlFor="alloc-date" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Date
            </label>
            <input
              id="alloc-date"
              type="date"
              max={today()}
              aria-invalid={Boolean(errors.allocationDate)}
              className={cn(
                "h-10 w-full rounded-lg border bg-surface px-3 text-sm text-text-primary focus:outline-none",
                errors.allocationDate ? "border-expense-500" : "border-border-strong focus:border-primary-500",
              )}
              {...register("allocationDate")}
            />
            {errors.allocationDate && (
              <p className="mt-1.5 text-xs text-expense-600">{errors.allocationDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="alloc-note" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Note <span className="text-text-tertiary">(Optional)</span>
            </label>
            <textarea
              id="alloc-note"
              rows={3}
              placeholder="e.g. Emergency fund, Retirement account..."
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
            {isSubmitting ? "Saving..." : "Save Allocation"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
