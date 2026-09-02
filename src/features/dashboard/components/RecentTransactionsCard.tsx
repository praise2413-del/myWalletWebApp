import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getCategoryColor, getCategoryIcon } from "@/lib/utils/categoryVisuals";
import { formatSignedCurrency } from "@/lib/utils/currency";
import type { TransactionType } from "@/types";

interface RecentTransaction {
  id: string;
  group: string;
  category: string;
  type: TransactionType;
  amount: number;
}

interface RecentTransactionsCardProps {
  transactions: RecentTransaction[];
  currency: string;
}

export function RecentTransactionsCard({ transactions, currency }: RecentTransactionsCardProps) {
  const groups = Array.from(new Set(transactions.map((t) => t.group)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <Link to="/transactions" className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-500">
          View all
        </Link>
      </CardHeader>
      <div className="p-5 pt-3">
        {transactions.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-tertiary">
            No transactions yet. Add your first income or expense to see it here.
          </p>
        ) : (
          groups.map((group) => (
          <div key={group} className="mb-4 last:mb-0">
            <p className="mb-2 text-xs font-medium text-text-tertiary">{group}</p>
            <ul className="space-y-3">
              {transactions
                .filter((t) => t.group === group)
                .map((t) => {
                  const Icon = getCategoryIcon(t.category);
                  const color = getCategoryColor(t.category);
                  return (
                    <li key={t.id} className="flex items-center gap-3">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
                      >
                        <Icon className="size-4" style={{ color }} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">{t.category}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={
                            t.type === "INCOME"
                              ? "text-sm font-semibold text-income-600"
                              : "text-sm font-semibold text-expense-600"
                          }
                        >
                          {formatSignedCurrency(t.amount, t.type, currency)}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {t.type === "INCOME" ? "Income" : "Expense"}
                        </p>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
          ))
        )}
      </div>
    </Card>
  );
}
