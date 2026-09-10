import { z } from "zod";

export const saleInvoiceLineSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.number().positive("Must be greater than zero"),
  unitPrice: z.number().min(0, "Cannot be negative"),
});

export const saleInvoiceFormSchema = z.object({
  customerId: z.string(), // "" allowed — a walk-in/cash sale with no customer on file
  invoiceNumber: z.string().trim().max(40, "Invoice number is too long"),
  invoiceDate: z.string().min(1, "Select a date"),
  dueDate: z.string(),
  notes: z.string().trim().max(500, "Notes are too long"),
  lines: z.array(saleInvoiceLineSchema).min(1, "Add at least one line"),
});
export type SaleInvoiceFormInput = z.infer<typeof saleInvoiceFormSchema>;

export const paymentFormSchema = z.object({
  paymentDate: z.string().min(1, "Select a date"),
  amount: z.number().positive("Must be greater than zero"),
  accountId: z.string().min(1, "Select an account"),
});
export type PaymentFormInput = z.infer<typeof paymentFormSchema>;
