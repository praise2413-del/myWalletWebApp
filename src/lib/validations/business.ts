import { z } from "zod";

export const BUSINESS_TYPE_OPTIONS = [
  { value: "RETAIL", label: "Retail" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "CONSULTING", label: "Consulting" },
  { value: "FREELANCER", label: "Freelancer" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "SERVICES", label: "Services" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "OTHER", label: "Other" },
] as const;

export const ACCOUNTING_BASIS_OPTIONS = [
  { value: "CASH", label: "Cash basis", hint: "Record income and expenses when money actually moves." },
  { value: "ACCRUAL", label: "Accrual basis", hint: "Record income and expenses when they're earned or incurred." },
] as const;

export const FINANCIAL_YEAR_MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, index) => ({ value: index + 1, label }));

export const businessOnboardingSchema = z.object({
  name: z.string().trim().min(1, "Enter a business name").max(80, "Name is too long"),
  businessType: z.enum([
    "RETAIL", "RESTAURANT", "CONSULTING", "FREELANCER",
    "CONSTRUCTION", "SERVICES", "MANUFACTURING", "OTHER",
  ]),
  industry: z.string().trim().max(80, "Industry is too long"),
  currency: z.string().trim().min(1, "Enter a currency code").max(8, "Currency code is too long"),
  financialYearStartMonth: z.number().int().min(1).max(12),
  accountingBasis: z.enum(["CASH", "ACCRUAL"]),
});
export type BusinessOnboardingInput = z.infer<typeof businessOnboardingSchema>;
