import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { Field, inputClass } from "@/features/business/components/formFields";
import { type CustomerFormInput, customerFormSchema } from "@/lib/validations/customer";
import type { Customer } from "@/types";

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  editingCustomer?: Customer | null;
  onSubmit: (values: CustomerFormInput) => Promise<{ error?: string } | void>;
}

const EMPTY: CustomerFormInput = { name: "", email: "", phone: "", address: "", notes: "" };

export function CustomerFormModal({ open, onClose, editingCustomer, onSubmit }: CustomerFormModalProps) {
  const isEditing = Boolean(editingCustomer);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormInput>({ resolver: zodResolver(customerFormSchema), defaultValues: EMPTY });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    reset(
      editingCustomer
        ? {
            name: editingCustomer.name,
            email: editingCustomer.email,
            phone: editingCustomer.phone,
            address: editingCustomer.address,
            notes: editingCustomer.notes,
          }
        : EMPTY,
    );
  }, [open, editingCustomer, reset]);

  return (
    <SlideOver open={open} onClose={onClose} title={isEditing ? "Edit Customer" : "Add Customer"} description="Customers appear when you create a sale invoice">
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

          <Field id="c-name" label="Name" error={errors.name?.message}>
            <input id="c-name" className={inputClass(Boolean(errors.name))} {...register("name")} />
          </Field>
          <Field id="c-email" label="Email" error={errors.email?.message} optional>
            <input id="c-email" type="email" className={inputClass(Boolean(errors.email))} {...register("email")} />
          </Field>
          <Field id="c-phone" label="Phone" error={errors.phone?.message} optional>
            <input id="c-phone" className={inputClass(Boolean(errors.phone))} {...register("phone")} />
          </Field>
          <Field id="c-address" label="Address" error={errors.address?.message} optional>
            <input id="c-address" className={inputClass(Boolean(errors.address))} {...register("address")} />
          </Field>
          <Field id="c-notes" label="Notes" error={errors.notes?.message} optional>
            <textarea
              id="c-notes"
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
            {isSubmitting ? "Saving..." : "Save Customer"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
