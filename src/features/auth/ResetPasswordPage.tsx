import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { supabase } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/utils/authErrors";
import { type ResetPasswordInput, resetPasswordSchema } from "@/lib/validations/auth";

type LinkStatus = "checking" | "valid" | "invalid";

/**
 * A reset email's link is single-use and time-limited. If it's already been
 * used (including by an email provider's automated link-scanner opening it
 * before the person does), expired, or malformed, Supabase redirects here
 * with an `#error=...` hash instead of a session — read that first so we
 * can say exactly that, rather than letting the page render a normal form
 * that's guaranteed to fail confusingly once submitted.
 */
function readHashError(): string | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const description = hash.get("error_description");
  return description ? description.replace(/\+/g, " ") : null;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("checking");
  const [linkErrorMessage, setLinkErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    const hashError = readHashError();
    if (hashError) {
      setLinkErrorMessage(hashError);
      setLinkStatus("invalid");
      return;
    }

    let active = true;
    // `getSession()` awaits Supabase's own initialization, which includes
    // exchanging the recovery link's URL token for a session — so this is
    // safe to check immediately on mount rather than racing it.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setLinkStatus(data.session ? "valid" : "invalid");
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) setLinkStatus("valid");
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async ({ password }: ResetPasswordInput) => {
    setFormError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }
    setDone(true);
  };

  const layoutProps = { headline: "Almost there" };

  if (linkStatus === "checking") {
    return (
      <AuthLayout {...layoutProps} title="Set a new password" description="Verifying your reset link...">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary-600 dark:text-primary-500" aria-hidden="true" />
        </div>
      </AuthLayout>
    );
  }

  if (linkStatus === "invalid") {
    return (
      <AuthLayout {...layoutProps} title="This link is invalid or has expired" description="Password reset links can only be used once, and expire after a while.">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-expense-50">
            <XCircle className="size-5 text-expense-600 dark:text-expense-500" aria-hidden="true" />
          </div>
          <p className="text-sm text-text-secondary">
            {linkErrorMessage ?? "This reset link is no longer valid."} Request a new one and use it right away.
          </p>
          <Link to="/forgot-password">
            <Button size="sm">Request a new link</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

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
