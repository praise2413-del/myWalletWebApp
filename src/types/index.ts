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

export type BusinessType =
  | "RETAIL"
  | "RESTAURANT"
  | "CONSULTING"
  | "FREELANCER"
  | "CONSTRUCTION"
  | "SERVICES"
  | "MANUFACTURING"
  | "OTHER";

export type AccountingBasis = "CASH" | "ACCRUAL";

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  businessType: BusinessType;
  /** What "Other" means, when businessType is OTHER. Empty otherwise. */
  businessTypeOther: string;
  industry: string;
  currency: string;
  /** 1 = January ... 12 = December. */
  financialYearStartMonth: number;
  accountingBasis: AccountingBasis;
  createdAt: string;
  updatedAt: string;
}

export type BusinessMemberRole = "OWNER" | "ACCOUNTANT" | "MANAGER" | "SALES" | "CASHIER";

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export interface BusinessAccount {
  id: string;
  businessId: string;
  code: string;
  name: string;
  type: AccountType;
  subtype: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  businessId: string;
  entryDate: string;
  description: string;
  reference: string;
  /** Null once the creating member's account has been deleted — the entry itself is preserved. */
  createdBy: string | null;
  createdAt: string;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  businessId: string;
  accountId: string;
  account: Pick<BusinessAccount, "id" | "code" | "name" | "type">;
  debit: number;
  credit: number;
  lineOrder: number;
  createdAt: string;
}

/** A journal entry plus its lines and pre-summed total — what the Journal Entries list needs. */
export interface JournalEntryWithLines extends JournalEntry {
  lines: JournalEntryLine[];
  total: number;
}

export interface AccountBalance {
  accountId: string;
  businessId: string;
  code: string;
  name: string;
  type: AccountType;
  totalDebit: number;
  totalCredit: number;
  /** Signed in the account type's normal-balance direction (debit-positive for ASSET/EXPENSE, credit-positive otherwise). */
  balance: number;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  sku: string;
  name: string;
  description: string;
  unitPrice: number;
  costPrice: number;
  quantityOnHand: number;
  incomeAccountId: string;
  expenseAccountId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleLine {
  id: string;
  saleId: string;
  productId: string;
  product: Pick<Product, "id" | "name" | "sku">;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  lineOrder: number;
}

export interface SalePayment {
  id: string;
  saleId: string;
  paymentDate: string;
  amount: number;
  accountId: string;
  accountName: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  businessId: string;
  customerId: string | null;
  customerName: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  notes: string;
  journalEntryId: string | null;
  createdAt: string;
  lines: SaleLine[];
  payments: SalePayment[];
  total: number;
  amountPaid: number;
}

export interface PurchaseLine {
  id: string;
  purchaseId: string;
  productId: string;
  product: Pick<Product, "id" | "name" | "sku">;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  lineOrder: number;
}

export interface PurchasePayment {
  id: string;
  purchaseId: string;
  paymentDate: string;
  amount: number;
  accountId: string;
  accountName: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  businessId: string;
  supplierId: string | null;
  supplierName: string | null;
  billNumber: string;
  billDate: string;
  dueDate: string | null;
  notes: string;
  journalEntryId: string | null;
  createdAt: string;
  lines: PurchaseLine[];
  payments: PurchasePayment[];
  total: number;
  amountPaid: number;
}

export interface Budget {
  id: string;
  businessId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  month: number;
  year: number;
  amount: number;
}

export type GoalType = "REVENUE" | "NET_PROFIT" | "CASH_RESERVE";

export interface BusinessGoal {
  id: string;
  businessId: string;
  name: string;
  goalType: GoalType;
  targetAmount: number;
  startDate: string;
  targetDate: string | null;
  notes: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  businessId: string;
  email: string;
  role: BusinessMemberRole;
  isOwner: boolean;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  businessId: string;
  userId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  createdAt: string;
}

/** Extend as new server-generated notification types are added (see migration). */
export type NotificationType = "WEEKLY_REPORT" | "PASSWORD_RESET";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  referenceType: string | null;
  referenceId: string | null;
  /** Set for WEEKLY_REPORT — the exact Monday-Sunday period this notification refers to. */
  periodStart: string | null;
  periodEnd: string | null;
}
