import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CustomerFormModal } from "@/features/business/components/CustomerFormModal";
import { useCustomers } from "@/features/business/hooks/useCustomers";
import { useBusiness } from "@/hooks/useBusiness";
import { useToastStore } from "@/hooks/useToastStore";
import { supabase } from "@/lib/supabase/client";
import { friendlyDbError } from "@/lib/utils/dbErrors";
import type { CustomerFormInput } from "@/lib/validations/customer";
import type { Customer } from "@/types";

export default function CustomersPage() {
  const { activeBusiness } = useBusiness();
  const showToast = useToastStore((state) => state.showToast);
  const { customers, loading, error, refresh } = useCustomers();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term) || c.phone.includes(term),
    );
  }, [customers, search]);

  const handleSubmit = async (values: CustomerFormInput) => {
    if (!activeBusiness) return { error: "No active business." };
    const payload = { business_id: activeBusiness.id, ...values };
    const { error: submitError } = editing
      ? await supabase.from("customers").update(payload).eq("id", editing.id)
      : await supabase.from("customers").insert(payload);
    if (submitError) return { error: friendlyDbError(submitError.message, "We couldn't save this customer.") };
    await refresh();
    showToast(editing ? "Customer updated." : "Customer added.");
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error: deleteError } = await supabase.from("customers").delete().eq("id", deleting.id);
    setDeleting(null);
    if (deleteError) {
      showToast(friendlyDbError(deleteError.message, "We couldn't delete this customer."), "error");
      return;
    }
    await refresh();
    showToast("Customer deleted.");
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        description="People and businesses you sell to."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="size-4" aria-hidden="true" />
            Add Customer
          </Button>
        }
      />

      <div className="relative mb-4 max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
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
          icon={Users}
          title={search ? "No matching customers" : "No customers yet"}
          description={search ? "Try a different search." : "Add a customer to speed up creating sales invoices."}
          action={!search && <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="size-4" aria-hidden="true" />Add Customer</Button>}
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{c.name}</p>
                <p className="truncate text-xs text-text-tertiary">{[c.email, c.phone].filter(Boolean).join(" · ") || "No contact info"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => { setEditing(c); setFormOpen(true); }} aria-label={`Edit ${c.name}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background hover:text-text-primary">
                  <Pencil className="size-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-expense-50 hover:text-expense-600">
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <CustomerFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} editingCustomer={editing} onSubmit={handleSubmit} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete customer?"
        description={`This will permanently delete ${deleting?.name ?? "this customer"}. Existing invoices keep their history.`}
      />
    </div>
  );
}
