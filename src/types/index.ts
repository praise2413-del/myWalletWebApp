export type TransactionType = "INCOME" | "EXPENSE";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  currency: string;
  /** Personal Savings & Investment Allocation target, as a percentage of recorded income. Defaults to 30. */
  allocationTarget: number;
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

export type AllocationType = "SAVING" | "INVESTMENT";

export interface Allocation {
  id: string;
  userId: string;
  type: AllocationType;
  amount: number;
  allocationDate: string;
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
