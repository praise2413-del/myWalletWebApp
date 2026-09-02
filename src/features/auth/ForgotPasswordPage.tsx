import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { supabase } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/utils/authErrors";
import { type ForgotPasswordInput, forgotPasswordSchema } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async ({ email }: ForgotPasswordInput) => {
    setFormError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }
    setSubmittedEmail(email);
  };

  const layoutProps = {
    headline: "Forgot your password?",
  };

  if (submittedEmail) {
    return (
      <AuthLayout {...layoutProps} title="Check your email" description="We've sent you a password reset link.">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary-50">
            <MailCheck className="size-5 text-primary-600 dark:text-primary-500" aria-hidden="true" />
          </div>
          <p className="text-sm text-text-secondary">
            Click the link we sent to <span className="font-medium text-text-primary">{submittedEmail}</span> to
            choose a new password.
          </p>
          <Link to="/login">
            <Button variant="outline" size="sm">
              Back to sign in
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      {...layoutProps}
      title="Reset your password"
      description="Enter the email associated with your account"
      footer={
        <Link to="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-500">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <AlertBanner message={formError} />}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending link..." : "Send Reset Link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
