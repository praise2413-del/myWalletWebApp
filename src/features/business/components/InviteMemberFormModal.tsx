import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass } from "@/features/business/components/formFields";
import { type InviteMemberFormInput, inviteMemberFormSchema, TEAM_ROLE_OPTIONS } from "@/lib/validations/teamMember";

interface InviteMemberFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: InviteMemberFormInput) => Promise<{ error?: string } | void>;
}

const EMPTY: InviteMemberFormInput = { email: "", role: "ACCOUNTANT" };

export function InviteMemberFormModal({ open, onClose, onSubmit }: InviteMemberFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberFormInput>({ resolver: zodResolver(inviteMemberFormSchema), defaultValues: EMPTY });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    reset(EMPTY);
  }, [open, reset]);

  const role = watch("role");
  const hint = TEAM_ROLE_OPTIONS.find((o) => o.value === role)?.hint;

  return (
    <Modal open={open} onClose={onClose} title="Invite Team Member" description="They must already have a myWallet account">
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

        <Field id="invite-email" label="Email" error={errors.email?.message}>
          <input id="invite-email" type="email" placeholder="teammate@example.com" className={inputClass(Boolean(errors.email))} {...register("email")} />
        </Field>

        <Field id="invite-role" label="Role" error={errors.role?.message}>
          <select id="invite-role" className={inputClass(Boolean(errors.role))} {...register("role")}>
            {TEAM_ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {hint && <p className="mt-1.5 text-xs text-text-tertiary">{hint}</p>}
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Inviting..." : "Send Invite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
