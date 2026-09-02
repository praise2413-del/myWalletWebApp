import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { supabase } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/utils/authErrors";
import { type ResetPasswordInput, resetPasswordSchema } from "@/lib/validations/auth";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async ({ password }: ResetPasswordInput) => {
    setFormError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }
    setDone(true);
  };

  const layoutProps = {
    headline: "Almost there",
    subtext: "Choose a new password to finish resetting your account.",
  };

  if (done) {
    return (
      <AuthLayout {...layoutProps} title="Password updated" description="You can now sign in with your new password.">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary-50">
            <CheckCircle2 className="size-5 text-primary-600 dark:text-primary-500" aria-hidden="true" />
          </div>
          <p className="text-sm text-text-secondary">Your password has been changed successfully.</p>
          <Button size="sm" onClick={() => navigate("/", { replace: true })}>
            Continue to myWallet
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout {...layoutProps} title="Set a new password" description="Make it something you'll remember">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <AlertBanner message={formError} />}
        <PasswordField
          label="New password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
