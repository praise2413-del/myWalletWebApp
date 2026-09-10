import { z } from "zod";

export const productFormSchema = z.object({
  sku: z.string().trim().max(40, "SKU is too long"),
  name: z.string().trim().min(1, "Enter a product name").max(120, "Name is too long"),
  description: z.string().trim().max(300, "Description is too long"),
  unitPrice: z.number().min(0, "Cannot be negative"),
  costPrice: z.number().min(0, "Cannot be negative"),
  incomeAccountId: z.string().min(1, "Choose the income account"),
  expenseAccountId: z.string().min(1, "Choose the expense/inventory account"),
});
export type ProductFormInput = z.infer<typeof productFormSchema>;
