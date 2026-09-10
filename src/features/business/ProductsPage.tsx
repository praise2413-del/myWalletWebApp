import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductFormModal } from "@/features/business/components/ProductFormModal";
import { useChartOfAccounts } from "@/features/business/hooks/useChartOfAccounts";
import { useProducts } from "@/features/business/hooks/useProducts";
import { useBusiness } from "@/hooks/useBusiness";
import { useToastStore } from "@/hooks/useToastStore";
import { supabase } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { friendlyDbError } from "@/lib/utils/dbErrors";
import type { ProductFormInput } from "@/lib/validations/product";
import type { Product } from "@/types";

export default function ProductsPage() {
  const { activeBusiness } = useBusiness();
  const currency = activeBusiness?.currency ?? "TZS";
  const showToast = useToastStore((state) => state.showToast);
  const { products, loading, error, refresh } = useProducts();
  const { accounts } = useChartOfAccounts();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
  }, [products, search]);

  const handleSubmit = async (values: ProductFormInput) => {
    if (!activeBusiness) return { error: "No active business." };
    const payload = {
      business_id: activeBusiness.id,
      sku: values.sku,
      name: values.name,
      description: values.description,
      unit_price: values.unitPrice,
      cost_price: values.costPrice,
      income_account_id: values.incomeAccountId,
      expense_account_id: values.expenseAccountId,
    };
    const { error: submitError } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (submitError) return { error: friendlyDbError(submitError.message, "We couldn't save this product.") };
    await refresh();
    showToast(editing ? "Product updated." : "Product added.");
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error: deleteError } = await supabase.from("products").delete().eq("id", deleting.id);
    setDeleting(null);
    if (deleteError) {
      showToast(friendlyDbError(deleteError.message, "We couldn't delete this product."), "error");
      return;
    }
    await refresh();
    showToast("Product deleted.");
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="The catalog used on sales invoices and purchase bills."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="size-4" aria-hidden="true" />
            Add Product
          </Button>
        }
      />

      <div className="relative mb-4 max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          aria-label="Search"
          className="h-9 w-full rounded-lg border border-border-strong bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none"
        />
      </div>

      {error ? (
        <AlertBanner message={error} />
      ) : loading ? (
        <Skeleton className="h-40 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "No matching products" : "No products yet"}
          description={search ? "Try a different search." : "Add a product to start creating sales invoices and purchase bills."}
          action={!search && <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="size-4" aria-hidden="true" />Add Product</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3 text-right">Selling Price</th>
                  <th className="px-5 py-3 text-right">Stock</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-background/60">
                    <td className="px-5 py-3">
                      <span className="font-medium text-text-primary">{p.name}</span>
                      {!p.isActive && <Badge className="ml-2">Inactive</Badge>}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-text-tertiary">{p.sku || "—"}</td>
                    <td className="px-5 py-3 text-right text-text-primary">{formatCurrency(p.unitPrice, currency)}</td>
                    <td className="px-5 py-3 text-right text-text-primary">{p.quantityOnHand}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => { setEditing(p); setFormOpen(true); }} aria-label={`Edit ${p.name}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary">
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-expense-50 hover:text-expense-600">
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ProductFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} accounts={accounts} currency={currency} editingProduct={editing} onSubmit={handleSubmit} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete product?"
        description={`This will permanently delete ${deleting?.name ?? "this product"}.`}
      />
    </div>
  );
}
