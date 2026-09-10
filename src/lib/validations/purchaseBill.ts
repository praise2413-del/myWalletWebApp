import { z } from "zod";

export const purchaseBillLineSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.number().positive("Must be greater than zero"),
  unitPrice: z.number().min(0, "Cannot be negative"),
});

export const purchaseBillFormSchema = z.object({
  supplierId: z.string(), // "" allowed — a cash purchase with no supplier on file
  billNumber: z.string().trim().max(40, "Bill number is too long"),
  billDate: z.string().min(1, "Select a date"),
  dueDate: z.string(),
  notes: z.string().trim().max(500, "Notes are too long"),
  lines: z.array(purchaseBillLineSchema).min(1, "Add at least one line"),
});
export type PurchaseBillFormInput = z.infer<typeof purchaseBillFormSchema>;
