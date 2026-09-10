import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { type JournalEntryFormInput, journalEntryFormSchema } from "@/lib/validations/journalEntry";
import type { BusinessAccount } from "@/types";

interface JournalEntryFormModalProps {
  open: boolean;
  onClose: () => void;
  accounts: BusinessAccount[];
  currency: string;
  onSubmit: (values: JournalEntryFormInput) => Promise<{ error?: string } | void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_LINE = { accountId: "", debit: 0, credit: 0 };

export function JournalEntryFormModal({ open, onClose, accounts, currency, onSubmit }: JournalEntryFormModalProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JournalEntryFormInput>({
    resolver: zodResolver(journalEntryFormSchema),
    defaultValues: {
      entryDate: today(),
      description: "",
      reference: "",
      lines: [EMPTY_LINE, EMPTY_LINE],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    reset({ entryDate: today(), description: "", reference: "", lines: [EMPTY_LINE, EMPTY_LINE] });
  }, [open, reset]);

  const lines = watch("lines");
  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const difference = totalDebit - totalCredit;
  const isBalanced = Math.abs(difference) < 0.005 && totalDebit > 0;

  return (
    <SlideOver open={open} onClose={onClose} title="New Journal Entry" description="Record a balanced double-entry transaction">
      <form
        onSubmit={handleSubmit(async (values) => {
          if (!isBalanced) return;
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
        <div className="flex-1 space-y-5 overflow-y-auto">
          {submitError && <AlertBanner message={submitError} />}

          <div>
            <label htmlFor="je-date" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Date
            </label>
            <input
              id="je-date"
              type="date"
              max={today()}
              aria-invalid={Boolean(errors.entryDate)}
              className={cn(
                "h-10 w-full rounded-lg border bg-surface px-3 text-sm text-text-primary focus:outline-none",
                errors.entryDate ? "border-expense-500" : "border-border-strong focus:border-primary-500",
              )}
              {...register("entryDate")}
            />
            {errors.entryDate && <p className="mt-1.5 text-xs text-expense-600">{errors.entryDate.message}</p>}
          </div>

          <div>
            <label htmlFor="je-description" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Description
            </label>
            <input
              id="je-description"
              type="text"
              placeholder="e.g. Cash sale of goods"
              aria-invalid={Boolean(errors.description)}
              className={cn(
                "h-10 w-full rounded-lg border bg-surface px-3 text-sm text-text-primary focus:outline-none",
                errors.description ? "border-expense-500" : "border-border-strong focus:border-primary-500",
              )}
              {...register("description")}
            />
            {errors.description && <p className="mt-1.5 text-xs text-expense-600">{errors.description.message}</p>}
          </div>

          <div>
            <label htmlFor="je-reference" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Reference <span className="text-text-tertiary">(Optional)</span>
            </label>
            <input
              id="je-reference"
              type="text"
              placeholder="e.g. Invoice #, receipt #"
              className="h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
              {...register("reference")}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="block text-sm font-medium text-text-secondary">Lines</span>
              <button
                type="button"
                onClick={() => append(EMPTY_LINE)}
                className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add Line
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-border-strong p-3">
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Account for line ${index + 1}`}
                      aria-invalid={Boolean(errors.lines?.[index]?.accountId)}
                      className={cn(
                        "h-9 flex-1 rounded-lg border bg-surface px-2.5 text-sm text-text-primary focus:outline-none",
                        errors.lines?.[index]?.accountId
                          ? "border-expense-500"
                          : "border-border-strong focus:border-primary-500",
                      )}
                      {...register(`lines.${index}.accountId` as const)}
                    >
                      <option value="">Select account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} · {account.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 2}
                      aria-label={`Remove line ${index + 1}`}
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-background disabled:pointer-events-none disabled:opacity-30"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={`je-debit-${index}`} className="mb-1 block text-xs text-text-tertiary">
                        Debit
                      </label>
                      <input
                        id={`je-debit-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="h-9 w-full rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
                        {...register(`lines.${index}.debit` as const, { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <label htmlFor={`je-credit-${index}`} className="mb-1 block text-xs text-text-tertiary">
                        Credit
                      </label>
                      <input
                        id={`je-credit-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="h-9 w-full rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
                        {...register(`lines.${index}.credit` as const, { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  {errors.lines?.[index]?.accountId && (
                    <p className="mt-1.5 text-xs text-expense-600">{errors.lines[index]?.accountId?.message}</p>
                  )}
                  {errors.lines?.[index]?.debit && (
                    <p className="mt-1.5 text-xs text-expense-600">{errors.lines[index]?.debit?.message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-background p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-tertiary">Total Debit</span>
              <span className="font-medium text-text-primary">{formatCurrency(totalDebit, currency)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-text-tertiary">Total Credit</span>
              <span className="font-medium text-text-primary">{formatCurrency(totalCredit, currency)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <span className="font-medium text-text-secondary">
                {isBalanced ? "Balanced" : "Difference"}
              </span>
              <span className={cn("font-semibold", isBalanced ? "text-income-600" : "text-expense-600")}>
                {isBalanced ? "✓" : formatCurrency(Math.abs(difference), currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting || !isBalanced}>
            {isSubmitting ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
