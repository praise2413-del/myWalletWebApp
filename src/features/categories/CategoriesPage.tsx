import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToastStore } from "@/hooks/useToastStore";
import { CategoryFormModal } from "@/features/categories/components/CategoryFormModal";
import { supabase } from "@/lib/supabase/client";
import { getCategoryColor, getCategoryIcon } from "@/lib/utils/categoryVisuals";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { friendlyDbError } from "@/lib/utils/dbErrors";
import type { CategoryFormInput } from "@/lib/validations/category";
import type { Category, TransactionType } from "@/types";

type Tab = TransactionType;

interface CategoryRow extends Category {
  transactionCount: number;
  total: number;
}

export default function CategoriesPage() {
  const { user, profile } = useAuth();
  const showToast = useToastStore((state) => state.showToast);
  const [tab, setTab] = useState<Tab>("EXPENSE");
  const [rows, setRows] = useState<{ EXPENSE: CategoryRow[]; INCOME: CategoryRow[] }>({
    EXPENSE: [],
    INCOME: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

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
            .select("id, user_id, name, type, icon, is_default, created_at, updated_at")
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
          userId: category.user_id,
          name: category.name,
          type: category.type,
          icon: category.icon,
          isDefault: category.is_default,
          createdAt: category.created_at,
          updatedAt: category.updated_at,
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
  }, [user, refreshKey]);

  const activeRows = rows[tab];

  const handleSubmit = async (values: CategoryFormInput) => {
    if (!user) return { error: "You must be signed in." };

    const { error: submitErrorMsg } = editingCategory
      ? await supabase
          .from("categories")
          .update({ name: values.name, icon: values.icon })
          .eq("id", editingCategory.id)
          .eq("user_id", user.id)
      : await supabase
          .from("categories")
          .insert({ user_id: user.id, name: values.name, type: values.type, icon: values.icon });

    if (submitErrorMsg) {
      return { error: friendlyDbError(submitErrorMsg.message, "We couldn't save this category. Please try again.") };
    }

    setRefreshKey((k) => k + 1);
    setEditingCategory(null);
    showToast(editingCategory ? "Category updated." : "Category added successfully.");
  };

  const handleDelete = async () => {
    if (!deletingCategory || !user) return;
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", deletingCategory.id)
      .eq("user_id", user.id);
    setDeletingCategory(null);
    if (deleteError) {
      showToast(friendlyDbError(deleteError.message, "We couldn't delete this category."), "error");
      return;
    }
    setRefreshKey((k) => k + 1);
    showToast("Category deleted.");
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Manage your income and expense categories"
        actions={
          <Button
            onClick={() => {
              setEditingCategory(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add Category
          </Button>
        }
      />

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
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((category) => {
                const Icon = getCategoryIcon(category.icon);
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
                        {category.isDefault && (
                          <span className="flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-text-tertiary">
                            <Lock className="size-2.5" aria-hidden="true" />
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 text-text-secondary sm:table-cell">
                      {category.transactionCount}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-text-primary">
                      {formatCurrency(category.total, profile?.currency ?? "TZS")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(category);
                            setFormOpen(true);
                          }}
                          aria-label={`Edit ${category.name}`}
                          className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary"
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCategory(category)}
                          disabled={category.isDefault}
                          aria-label={category.isDefault ? `${category.name} is a default category and can't be deleted` : `Delete ${category.name}`}
                          className={cn(
                            "flex size-8 items-center justify-center rounded-lg text-text-tertiary",
                            category.isDefault
                              ? "cursor-not-allowed opacity-30"
                              : "hover:bg-expense-50 hover:text-expense-600",
                          )}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <CategoryFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingCategory(null);
        }}
        initialType={tab}
        editingCategory={editingCategory}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        title="Delete category?"
        description={`This will permanently delete "${deletingCategory?.name}". This can't be undone.`}
      />
    </div>
  );
}
