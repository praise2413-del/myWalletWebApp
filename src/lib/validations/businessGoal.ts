import { z } from "zod";

export const GOAL_TYPE_OPTIONS = [
  { value: "REVENUE", label: "Revenue Target", hint: "Cumulative revenue recorded since the start date reaches the target." },
  { value: "NET_PROFIT", label: "Net Profit Target", hint: "Cumulative net profit recorded since the start date reaches the target." },
  { value: "CASH_RESERVE", label: "Cash Reserve", hint: "The business's cash + bank balance reaches the target." },
] as const;

export const businessGoalFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a goal name").max(120, "Name is too long"),
  goalType: z.enum(["REVENUE", "NET_PROFIT", "CASH_RESERVE"]),
  targetAmount: z.number().positive("Must be greater than zero"),
  startDate: z.string().min(1, "Select a start date"),
  targetDate: z.string(),
  notes: z.string().trim().max(500, "Notes are too long"),
});
export type BusinessGoalFormInput = z.infer<typeof businessGoalFormSchema>;
