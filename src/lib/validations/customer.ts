import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a customer name").max(120, "Name is too long"),
  email: z.string().trim().max(120, "Email is too long"),
  phone: z.string().trim().max(30, "Phone number is too long"),
  address: z.string().trim().max(200, "Address is too long"),
  notes: z.string().trim().max(500, "Notes are too long"),
});
export type CustomerFormInput = z.infer<typeof customerFormSchema>;
