import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { Field, inputClass } from "@/features/business/components/formFields";
import { type ProductFormInput, productFormSchema } from "@/lib/validations/product";
import type { BusinessAccount, Product } from "@/types";

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  accounts: BusinessAccount[];
  currency: string;
  editingProduct?: Product | null;
  onSubmit: (values: ProductFormInput) => Promise<{ error?: string } | void>;
}

const EMPTY: ProductFormInput = { sku: "", name: "", description: "", unitPrice: 0, costPrice: 0, incomeAccountId: "", expenseAccountId: "" };

export function ProductFormModal({ open, onClose, accounts, currency, editingProduct, onSubmit }: ProductFormModalProps) {
  const isEditing = Boolean(editingProduct);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput>({ resolver: zodResolver(productFormSchema), defaultValues: EMPTY });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const incomeOptions = accounts.filter((a) => a.type === "REVENUE");
  const expenseOptions = accounts.filter((a) => a.type === "ASSET" || a.type === "EXPENSE");
  const defaultIncome = incomeOptions.find((a) => a.code === "4000")?.id ?? incomeOptions[0]?.id ?? "";
  const defaultExpense = expenseOptions.find((a) => a.code === "1300")?.id ?? expenseOptions[0]?.id ?? "";

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    reset(
      editingProduct
        ? {
            sku: editingProduct.sku,
            name: editingProduct.name,
            description: editingProduct.description,
            unitPrice: editingProduct.unitPrice,
            costPrice: editingProduct.costPrice,
            incomeAccountId: editingProduct.incomeAccountId,
            expenseAccountId: editingProduct.expenseAccountId,
          }
        : { ...EMPTY, incomeAccountId: defaultIncome, expenseAccountId: defaultExpense },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingProduct, reset]);

  return (
    <SlideOver open={open} onClose={onClose} title={isEditing ? "Edit Product" : "Add Product"} description="Products appear as line items on sales invoices and purchase bills">
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

          <Field id="p-name" label="Name" error={errors.name?.message}>
            <input id="p-name" className={inputClass(Boolean(errors.name))} {...register("name")} />
          </Field>
          <Field id="p-sku" label="SKU" error={errors.sku?.message} optional>
            <input id="p-sku" className={inputClass(Boolean(errors.sku))} {...register("sku")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="p-unit-price" label={`Selling Price (${currency})`} error={errors.unitPrice?.message}>
              <input id="p-unit-price" type="number" step="0.01" min="0" className={inputClass(Boolean(errors.unitPrice))} {...register("unitPrice", { valueAsNumber: true })} />
            </Field>
            <Field id="p-cost-price" label={`Cost Price (${currency})`} error={errors.costPrice?.message} optional>
              <input id="p-cost-price" type="number" step="0.01" min="0" className={inputClass(Boolean(errors.costPrice))} {...register("costPrice", { valueAsNumber: true })} />
            </Field>
          </div>
          <Field id="p-income-account" label="Income Account" error={errors.incomeAccountId?.message}>
            <select id="p-income-account" className={inputClass(Boolean(errors.incomeAccountId))} {...register("incomeAccountId")}>
              <option value="">Select account</option>
              {incomeOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="p-expense-account" label="Inventory / Expense Account" error={errors.expenseAccountId?.message}>
            <select id="p-expense-account" className={inputClass(Boolean(errors.expenseAccountId))} {...register("expenseAccountId")}>
              <option value="">Select account</option>
              {expenseOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="p-description" label="Description" error={errors.description?.message} optional>
            <textarea
              id="p-description"
              rows={2}
              className="w-full resize-none rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
              {...register("description")}
            />
          </Field>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
