import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { type FocusEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { supabase } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/utils/authErrors";
import { domainAcceptsEmail, extractEmailDomain } from "@/lib/utils/emailDomainCheck";
import { type RegisterInput, registerSchema } from "@/lib/validations/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  // Beyond the zod format check, verify the domain can actually receive
  // mail (catches typos like gmial.com or a nonexistent domain) — only
  // runs once the format itself is already valid, and never blocks
  // signup if the lookup itself is inconclusive (see domainAcceptsEmail).
  const emailRegistration = register("email", {
    onBlur: async (e: FocusEvent<HTMLInputElement>) => {
      const formatValid = await trigger("email");
      if (!formatValid) return;

      const domain = extractEmailDomain(e.target.value);
      if (!domain) return;

      setCheckingEmail(true);
      const result = await domainAcceptsEmail(domain);
      setCheckingEmail(false);

      if (result === false) {
        setError("email", { type: "manual", message: "Invalid email" });
      }
    },
    onChange: () => {
      clearErrors("email");
    },
  });

  const onSubmit = async ({ fullName, email, password }: RegisterInput) => {
    setFormError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }

    if (data.session) {
      navigate("/", { replace: true });
      return;
    }

    setSubmittedEmail(email);
  };

  const layoutProps = {
    headline: "Take control of your financial future",
  };

  if (submittedEmail) {
    return (
      <AuthLayout
        {...layoutProps}
        title="Check your email"
        description="We've sent a confirmation link to finish setting up your account."
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary-50">
            <MailCheck className="size-5 text-primary-600 dark:text-primary-500" aria-hidden="true" />
          </div>
          <p className="text-sm text-text-secondary">
            Click the link we sent to <span className="font-medium text-text-primary">{submittedEmail}</span> to
            confirm your account, then sign in.
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
      title="Create your account"
      description="Start your journey to financial clarity"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-500">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <AlertBanner message={formError} />}

        <TextField
          label="Full Name"
          autoComplete="name"
          placeholder="Praise Victor"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="enter valid email only"
          error={errors.email?.message}
          hint={checkingEmail ? "Checking email…" : undefined}
          {...emailRegistration}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordField
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <div>
          <label className="flex items-start gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-border-strong text-primary-600 focus:ring-primary-500"
              {...register("agreeToTerms")}
            />
            <span>
              I agree to the{" "}
              <Link
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-600 hover:underline dark:text-primary-500"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-600 hover:underline dark:text-primary-500"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="mt-1.5 text-xs text-expense-600">{errors.agreeToTerms.message}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
