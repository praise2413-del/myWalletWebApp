import { z } from "zod";

export const TEAM_ROLE_OPTIONS = [
  { value: "ACCOUNTANT", label: "Accountant", hint: "Full access to accounting, statements, and reports." },
  { value: "MANAGER", label: "Manager", hint: "Full access to day-to-day operations and planning." },
  { value: "SALES", label: "Sales", hint: "Intended for sales-focused work (customers, invoices)." },
  { value: "CASHIER", label: "Cashier", hint: "Intended for recording day-to-day sales and payments." },
] as const;

export const inviteMemberFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  role: z.enum(["ACCOUNTANT", "MANAGER", "SALES", "CASHIER"]),
});
export type InviteMemberFormInput = z.infer<typeof inviteMemberFormSchema>;
