import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass } from "@/features/business/components/formFields";
import { CASH_ACCOUNT_CODES } from "@/features/business/lib/statements";
import { formatCurrency } from "@/lib/utils/currency";
import { type PaymentFormInput, paymentFormSchema } from "@/lib/validations/saleInvoice";
import type { BusinessAccount } from "@/types";

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  remainingBalance: number;
  currency: string;
  accounts: BusinessAccount[];
  onSubmit: (values: PaymentFormInput) => Promise<{ error?: string } | void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentFormModal({ open, onClose, title, remainingBalance, currency, accounts, onSubmit }: PaymentFormModalProps) {
  const cashAccounts = accounts.filter((a) => CASH_ACCOUNT_CODES.includes(a.code));
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { paymentDate: today(), amount: remainingBalance, accountId: cashAccounts[0]?.id ?? "" },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    reset({ paymentDate: today(), amount: remainingBalance, accountId: cashAccounts[0]?.id ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, remainingBalance, reset]);

  return (
    <Modal open={open} onClose={onClose} title={title} description={`Remaining balance: ${formatCurrency(remainingBalance, currency)}`}>
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

        <Field id="pay-date" label="Payment Date" error={errors.paymentDate?.message}>
          <input id="pay-date" type="date" max={today()} className={inputClass(Boolean(errors.paymentDate))} {...register("paymentDate")} />
        </Field>
        <Field id="pay-amount" label={`Amount (${currency})`} error={errors.amount?.message}>
          <input id="pay-amount" type="number" step="0.01" min="0" className={inputClass(Boolean(errors.amount))} {...register("amount", { valueAsNumber: true })} />
        </Field>
        <Field id="pay-account" label="Paid Into / From" error={errors.accountId?.message}>
          <select id="pay-account" className={inputClass(Boolean(errors.accountId))} {...register("accountId")}>
            <option value="">Select account</option>
            {cashAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
