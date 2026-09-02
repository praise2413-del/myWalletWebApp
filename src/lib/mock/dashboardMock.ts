export const MOCK_SUMMARY = {
  openingBalance: 0,
  income: 1_800_000,
  expenses: 560_000,
  get netCashFlow() {
    return this.income - this.expenses;
  },
  get balance() {
    return this.openingBalance + this.income - this.expenses;
  },
  deltas: {
    balance: 12.5,
    income: 8.3,
    expenses: -5.6,
    netCashFlow: 15.2,
  },
};

export const MOCK_SPENDING_BY_CATEGORY = [
  { name: "Food", amount: 196_000 },
  { name: "Transport", amount: 112_000 },
  { name: "Shopping", amount: 84_000 },
  { name: "Bills", amount: 67_000 },
  { name: "Other", amount: 101_000 },
];

export const MOCK_RECENT_TRANSACTIONS = [
  {
    id: "t1",
    group: "Today",
    category: "Shopping",
    type: "EXPENSE" as const,
    amount: 45_000,
  },
  {
    id: "t2",
    group: "Today",
    category: "Salary",
    type: "INCOME" as const,
    amount: 1_000_000,
  },
  {
    id: "t3",
    group: "Yesterday",
    category: "Transport",
    type: "EXPENSE" as const,
    amount: 10_000,
  },
  {
    id: "t4",
    group: "Yesterday",
    category: "Utilities",
    type: "EXPENSE" as const,
    amount: 70_000,
  },
];

export const MOCK_SPENDING_TREND = [
  6, 12, 22, 18, 30, 45, 38, 52, 41, 60, 48, 35, 42, 58, 65, 50, 44, 62, 70, 55, 48, 40,
  56, 68, 78, 60, 52, 45, 38, 30, 26,
].map((value, index) => ({
  day: index + 1,
  amount: value * 1000,
}));

export const MOCK_DASHBOARD_INSIGHT = {
  title: "Food represents 35% of your expenses this month.",
  body: "You spent TZS 196,000 on Food, which is 12% higher than last month.",
};

export const MOCK_ALLOCATION = {
  savings: 300_000,
  investment: 240_000,
};
