import { z } from "zod";

export const budgetFormSchema = z.object({
  accountId: z.string().min(1, "Select an account"),
  amount: z.number().min(0, "Cannot be negative"),
});
export type BudgetFormInput = z.infer<typeof budgetFormSchema>;
