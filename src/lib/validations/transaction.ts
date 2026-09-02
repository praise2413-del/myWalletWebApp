import { z } from "zod";

export const transactionFormSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z
    .number({ error: "Enter an amount" })
    .positive("Amount must be greater than zero"),
  categoryId: z.string().min(1, "Select a category"),
  transactionDate: z.string().min(1, "Select a date"),
  note: z.string().max(280, "Note is too long").optional(),
});
export type TransactionFormInput = z.infer<typeof transactionFormSchema>;

export const allocationFormSchema = z.object({
  type: z.enum(["SAVING", "INVESTMENT"]),
  amount: z
    .number({ error: "Enter an amount" })
    .positive("Amount must be greater than zero"),
  allocationDate: z.string().min(1, "Select a date"),
  note: z.string().max(280, "Note is too long").optional(),
});
export type AllocationFormInput = z.infer<typeof allocationFormSchema>;
