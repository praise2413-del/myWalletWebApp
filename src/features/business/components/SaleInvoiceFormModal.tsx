import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { Field, inputClass } from "@/features/business/components/formFields";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { type SaleInvoiceFormInput, saleInvoiceFormSchema } from "@/lib/validations/saleInvoice";
import type { Customer, Product } from "@/types";

interface SaleInvoiceFormModalProps {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  products: Product[];
  currency: string;
  onSubmit: (values: SaleInvoiceFormInput) => Promise<{ error?: string } | void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_LINE = { productId: "", quantity: 1, unitPrice: 0 };

export function SaleInvoiceFormModal({ open, onClose, customers, products, currency, onSubmit }: SaleInvoiceFormModalProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaleInvoiceFormInput>({
    resolver: zodResolver(saleInvoiceFormSchema),
    defaultValues: { customerId: "", invoiceNumber: "", invoiceDate: today(), dueDate: "", notes: "", lines: [EMPTY_LINE] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    reset({ customerId: "", invoiceNumber: "", invoiceDate: today(), dueDate: "", notes: "", lines: [EMPTY_LINE] });
  }, [open, reset]);

  const lines = watch("lines");
  const total = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);

  return (
    <SlideOver open={open} onClose={onClose} title="New Sale Invoice" description="Automatically posts to Accounts Receivable and the product's income account">
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
        <div className="flex-1 space-y-5 overflow-y-auto">
          {submitError && <AlertBanner message={submitError} />}

          <Field id="si-customer" label="Customer" optional>
            <select id="si-customer" className={inputClass(false)} {...register("customerId")}>
              <option value="">Walk-in / cash sale</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field id="si-date" label="Invoice Date" error={errors.invoiceDate?.message}>
              <input id="si-date" type="date" max={today()} className={inputClass(Boolean(errors.invoiceDate))} {...register("invoiceDate")} />
            </Field>
            <Field id="si-due" label="Due Date" optional>
              <input id="si-due" type="date" className={inputClass(false)} {...register("dueDate")} />
            </Field>
          </div>

          <Field id="si-number" label="Invoice Number" optional>
            <input id="si-number" className={inputClass(false)} {...register("invoiceNumber")} />
          </Field>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="block text-sm font-medium text-text-secondary">Lines</span>
              <button type="button" onClick={() => append(EMPTY_LINE)} className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                <Plus className="size-3.5" aria-hidden="true" />
                Add Line
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => {
                const lineTotal = (Number(lines[index]?.quantity) || 0) * (Number(lines[index]?.unitPrice) || 0);
                return (
                  <div key={field.id} className="rounded-lg border border-border-strong p-3">
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Product for line ${index + 1}`}
                        className={cn(inputClass(Boolean(errors.lines?.[index]?.productId)), "h-9 flex-1")}
                        {...register(`lines.${index}.productId` as const, {
                          onChange: (e) => {
                            const product = products.find((p) => p.id === e.target.value);
                            if (product) setValue(`lines.${index}.unitPrice`, product.unitPrice);
                          },
                        })}
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button type="button" onClick={() => remove(index)} disabled={fields.length <= 1} aria-label={`Remove line ${index + 1}`} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-background disabled:pointer-events-none disabled:opacity-30">
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor={`si-qty-${index}`} className="mb-1 block text-xs text-text-tertiary">Quantity</label>
                        <input id={`si-qty-${index}`} type="number" step="0.01" min="0" className="h-9 w-full rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none" {...register(`lines.${index}.quantity` as const, { valueAsNumber: true })} />
                      </div>
                      <div>
                        <label htmlFor={`si-price-${index}`} className="mb-1 block text-xs text-text-tertiary">Unit Price</label>
                        <input id={`si-price-${index}`} type="number" step="0.01" min="0" className="h-9 w-full rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none" {...register(`lines.${index}.unitPrice` as const, { valueAsNumber: true })} />
                      </div>
                    </div>
                    <p className="mt-2 text-right text-xs text-text-tertiary">Line total: {formatCurrency(lineTotal, currency)}</p>
                  </div>
                );
              })}
            </div>
            {errors.lines?.message && <p className="mt-1.5 text-xs text-expense-600">{errors.lines.message}</p>}
          </div>

          <Field id="si-notes" label="Notes" optional>
            <textarea id="si-notes" rows={2} className="w-full resize-none rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none" {...register("notes")} />
          </Field>

          <div className="rounded-lg bg-background p-3 text-sm">
            <div className="flex items-center justify-between font-semibold text-text-primary">
              <span>Total</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting || total <= 0}>
            {isSubmitting ? "Saving..." : "Save Invoice"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
