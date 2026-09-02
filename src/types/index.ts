export type TransactionType = "INCOME" | "EXPENSE";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  icon: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  category: Pick<Category, "id" | "name" | "icon" | "type">;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export type InsightTone = "positive" | "attention" | "observation";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  explanation: string;
  comparison?: string;
}
