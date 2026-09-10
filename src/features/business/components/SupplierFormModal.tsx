import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { Field, inputClass } from "@/features/business/components/formFields";
import { type SupplierFormInput, supplierFormSchema } from "@/lib/validations/supplier";
import type { Supplier } from "@/types";

interface SupplierFormModalProps {
  open: boolean;
  onClose: () => void;
  editingSupplier?: Supplier | null;
  onSubmit: (values: SupplierFormInput) => Promise<{ error?: string } | void>;
}

const EMPTY: SupplierFormInput = { name: "", email: "", phone: "", address: "", notes: "" };

export function SupplierFormModal({ open, onClose, editingSupplier, onSubmit }: SupplierFormModalProps) {
  const isEditing = Boolean(editingSupplier);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormInput>({ resolver: zodResolver(supplierFormSchema), defaultValues: EMPTY });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    reset(
      editingSupplier
        ? {
            name: editingSupplier.name,
            email: editingSupplier.email,
            phone: editingSupplier.phone,
            address: editingSupplier.address,
            notes: editingSupplier.notes,
          }
        : EMPTY,
    );
  }, [open, editingSupplier, reset]);

  return (
    <SlideOver open={open} onClose={onClose} title={isEditing ? "Edit Supplier" : "Add Supplier"} description="Suppliers appear when you create a purchase bill">
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

          <Field id="s-name" label="Name" error={errors.name?.message}>
            <input id="s-name" className={inputClass(Boolean(errors.name))} {...register("name")} />
          </Field>
          <Field id="s-email" label="Email" error={errors.email?.message} optional>
            <input id="s-email" type="email" className={inputClass(Boolean(errors.email))} {...register("email")} />
          </Field>
          <Field id="s-phone" label="Phone" error={errors.phone?.message} optional>
            <input id="s-phone" className={inputClass(Boolean(errors.phone))} {...register("phone")} />
          </Field>
          <Field id="s-address" label="Address" error={errors.address?.message} optional>
            <input id="s-address" className={inputClass(Boolean(errors.address))} {...register("address")} />
          </Field>
          <Field id="s-notes" label="Notes" error={errors.notes?.message} optional>
            <textarea
              id="s-notes"
              rows={3}
              className="w-full resize-none rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
              {...register("notes")}
            />
          </Field>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Supplier"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
