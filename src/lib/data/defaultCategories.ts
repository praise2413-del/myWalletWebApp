import type { TransactionType } from "@/types";

export interface DefaultCategory {
  name: string;
  type: TransactionType;
}

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  "Food",
  "Transport",
  "Rent",
  "Utilities",
  "Education",
  "Health",
  "Shopping",
  "Entertainment",
  "Communication",
  "Family",
  "Personal Care",
  "Bills",
  "Other",
].map((name) => ({ name, type: "EXPENSE" as const }));

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  "Salary",
  "Business",
  "Freelance",
  "Allowance",
  "Gift",
  "Investment",
  "Other",
].map((name) => ({ name, type: "INCOME" as const }));
