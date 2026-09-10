import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { useBusiness } from "@/hooks/useBusiness";
import {
  ACCOUNTING_BASIS_OPTIONS,
  BUSINESS_TYPE_OPTIONS,
  type BusinessOnboardingInput,
  businessOnboardingSchema,
  FINANCIAL_YEAR_MONTH_OPTIONS,
} from "@/lib/validations/business";

export default function BusinessOnboardingPage() {
  const navigate = useNavigate();
  const { activeBusiness, loading, createBusiness } = useBusiness();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BusinessOnboardingInput>({
    resolver: zodResolver(businessOnboardingSchema),
    defaultValues: {
      name: "",
      businessType: "OTHER",
      businessTypeOther: "",
      industry: "",
      currency: "TZS",
      financialYearStartMonth: 1,
      accountingBasis: "CASH",
    },
  });

  const businessType = watch("businessType");

  useEffect(() => {
    document.title = "Set up Business — myWallet";
  }, []);

  // A business already exists — don't re-run onboarding, go straight in.
  if (!loading && activeBusiness) {
    return <Navigate to="/business" replace />;
  }

  return (
    <div className="mx-auto max-w-xl py-6">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/15">
          <Briefcase className="size-6 text-primary-600 dark:text-primary-500" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Welcome to myWallet Business</h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Tell us a bit about your business. You don't need any accounting knowledge to get started —
          we'll set up a starter chart of accounts for you automatically.
        </p>
      </div>

      <Card>
        <CardContent>
          <form
            onSubmit={handleSubmit(async (values) => {
              setSubmitError(null);
              const result = await createBusiness(values);
              if (result.error) {
                setSubmitError(result.error);
                return;
              }
              navigate("/business");
            })}
            noValidate
            className="space-y-5"
          >
            {submitError && <AlertBanner message={submitError} />}

            <TextField
              label="Business Name"
              placeholder="e.g. Amani General Store"
              error={errors.name?.message}
              {...register("name")}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary" htmlFor="businessType">
                  Business Type
                </label>
                <select
                  id="businessType"
                  className="h-10 w-full rounded-lg border border-border-strong bg-background px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
                  {...register("businessType")}
                >
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <TextField
                label="Industry"
                placeholder="Optional"
                error={errors.industry?.message}
                {...register("industry")}
              />
            </div>

            {businessType === "OTHER" && (
              <TextField
                label="Please specify"
                placeholder="e.g. Event Planning"
                error={errors.businessTypeOther?.message}
                {...register("businessTypeOther")}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Currency"
                placeholder="e.g. TZS"
                error={errors.currency?.message}
                {...register("currency")}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary" htmlFor="financialYearStartMonth">
                  Financial Year Starts
                </label>
                <select
                  id="financialYearStartMonth"
                  className="h-10 w-full rounded-lg border border-border-strong bg-background px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
                  {...register("financialYearStartMonth", { valueAsNumber: true })}
                >
                  {FINANCIAL_YEAR_MONTH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-text-secondary">Accounting Basis</span>
              <div className="grid grid-cols-2 gap-3">
                {ACCOUNTING_BASIS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border-strong p-3 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-500/10"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                      <input type="radio" value={option.value} className="accent-primary-600" {...register("accountingBasis")} />
                      {option.label}
                    </span>
                    <span className="text-xs text-text-tertiary">{option.hint}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Creating your business..." : "Create Business"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
