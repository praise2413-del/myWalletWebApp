import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a category name").max(40, "Name is too long"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().min(1, "Choose an icon"),
});
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
