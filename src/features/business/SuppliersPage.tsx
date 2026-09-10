import { Pencil, Plus, Search, Trash2, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SupplierFormModal } from "@/features/business/components/SupplierFormModal";
import { useSuppliers } from "@/features/business/hooks/useSuppliers";
import { useBusiness } from "@/hooks/useBusiness";
import { useToastStore } from "@/hooks/useToastStore";
import { supabase } from "@/lib/supabase/client";
import { friendlyDbError } from "@/lib/utils/dbErrors";
import type { SupplierFormInput } from "@/lib/validations/supplier";
import type { Supplier } from "@/types";

export default function SuppliersPage() {
  const { activeBusiness } = useBusiness();
  const showToast = useToastStore((state) => state.showToast);
  const { suppliers, loading, error, refresh } = useSuppliers();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter(
      (s) => s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term) || s.phone.includes(term),
    );
  }, [suppliers, search]);

  const handleSubmit = async (values: SupplierFormInput) => {
    if (!activeBusiness) return { error: "No active business." };
    const payload = { business_id: activeBusiness.id, ...values };
    const { error: submitError } = editing
      ? await supabase.from("suppliers").update(payload).eq("id", editing.id)
      : await supabase.from("suppliers").insert(payload);
    if (submitError) return { error: friendlyDbError(submitError.message, "We couldn't save this supplier.") };
    await refresh();
    showToast(editing ? "Supplier updated." : "Supplier added.");
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error: deleteError } = await supabase.from("suppliers").delete().eq("id", deleting.id);
    setDeleting(null);
    if (deleteError) {
      showToast(friendlyDbError(deleteError.message, "We couldn't delete this supplier."), "error");
      return;
    }
    await refresh();
    showToast("Supplier deleted.");
  };

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="People and businesses you buy from."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="size-4" aria-hidden="true" />
            Add Supplier
          </Button>
        }
      />

      <div className="relative mb-4 max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers..."
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
          icon={Truck}
          title={search ? "No matching suppliers" : "No suppliers yet"}
          description={search ? "Try a different search." : "Add a supplier to speed up creating purchase bills."}
          action={!search && <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="size-4" aria-hidden="true" />Add Supplier</Button>}
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {filtered.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{s.name}</p>
                <p className="truncate text-xs text-text-tertiary">{[s.email, s.phone].filter(Boolean).join(" · ") || "No contact info"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => { setEditing(s); setFormOpen(true); }} aria-label={`Edit ${s.name}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary">
                  <Pencil className="size-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setDeleting(s)} aria-label={`Delete ${s.name}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-expense-50 hover:text-expense-600">
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <SupplierFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} editingSupplier={editing} onSubmit={handleSubmit} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete supplier?"
        description={`This will permanently delete ${deleting?.name ?? "this supplier"}. Existing bills keep their history.`}
      />
    </div>
  );
}
