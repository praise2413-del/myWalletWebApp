import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { getCategoryColor, getCategoryIcon } from "@/lib/utils/categoryVisuals";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import type { TransactionType } from "@/types";

type Tab = TransactionType;

interface CategoryRow {
  id: string;
  name: string;
  transactionCount: number;
  total: number;
}

export default function CategoriesPage() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("EXPENSE");
  const [rows, setRows] = useState<{ EXPENSE: CategoryRow[]; INCOME: CategoryRow[] }>({
    EXPENSE: [],
    INCOME: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const [{ data: categories, error: categoriesError }, { data: transactions, error: transactionsError }] =
        await Promise.all([
          supabase
            .from("categories")
            .select("id, name, type")
            .order("name"),
          supabase.from("transactions").select("category_id, amount"),
        ]);

      if (!active) return;

      if (categoriesError || transactionsError) {
        setError("We couldn't load your categories. Please try again.");
        setLoading(false);
        return;
      }

      const totalsByCategory = new Map<string, { count: number; total: number }>();
      for (const t of transactions ?? []) {
        const entry = totalsByCategory.get(t.category_id) ?? { count: 0, total: 0 };
        entry.count += 1;
        entry.total += t.amount;
        totalsByCategory.set(t.category_id, entry);
      }

      const grouped: { EXPENSE: CategoryRow[]; INCOME: CategoryRow[] } = { EXPENSE: [], INCOME: [] };
      for (const category of categories ?? []) {
        const totals = totalsByCategory.get(category.id) ?? { count: 0, total: 0 };
        grouped[category.type].push({
          id: category.id,
          name: category.name,
          transactionCount: totals.count,
          total: totals.total,
        });
      }

      setRows(grouped);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [user]);

  const activeRows = rows[tab];

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
              tab === value ? "bg-primary-600 text-white" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {value === "EXPENSE" ? "Expense Categories" : "Income Categories"}
          </button>
        ))}
      </div>

      {error && <AlertBanner message={error} />}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
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
              {activeRows.map((category) => {
                const Icon = getCategoryIcon(category.name);
                const color = getCategoryColor(category.name);
                return (
                  <tr key={category.id} className="border-b border-border last:border-0">
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
                    <td className="hidden px-5 py-3 text-text-secondary sm:table-cell">
                      {category.transactionCount}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-text-primary">
                      {formatCurrency(category.total, profile?.currency ?? "TZS")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
