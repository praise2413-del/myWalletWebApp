import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/data/defaultCategories";
import { getCategoryColor, getCategoryIcon } from "@/lib/utils/categoryVisuals";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { MOCK_CURRENT_USER } from "@/lib/mock/currentUser";

type Tab = "EXPENSE" | "INCOME";

export default function CategoriesPage() {
  const [tab, setTab] = useState<Tab>("EXPENSE");
  const categories = tab === "EXPENSE" ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;

  return (
    <div>
      <PageHeader title="Categories" description="Manage your income and expense categories" />

      <div className="mb-4 inline-flex rounded-lg border border-border bg-surface p-1">
        {(["EXPENSE", "INCOME"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              tab === value
                ? "bg-primary-600 text-white"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {value === "EXPENSE" ? "Expense Categories" : "Income Categories"}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Transactions</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.name);
              const color = getCategoryColor(category.name);
              return (
                <tr key={category.name} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
                      >
                        <Icon className="size-4" style={{ color }} aria-hidden="true" />
                      </span>
                      <span className="font-medium text-text-primary">{category.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-5 py-3 text-text-secondary sm:table-cell">0</td>
                  <td className="px-5 py-3 text-right font-medium text-text-primary">
                    {formatCurrency(0, MOCK_CURRENT_USER.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
