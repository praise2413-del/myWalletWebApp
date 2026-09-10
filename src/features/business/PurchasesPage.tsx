import { Receipt, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { PaymentFormModal } from "@/features/business/components/PaymentFormModal";
import { PurchaseBillFormModal } from "@/features/business/components/PurchaseBillFormModal";
import { PurchaseDetailModal } from "@/features/business/components/PurchaseDetailModal";
import { PurchasesTable } from "@/features/business/components/PurchasesTable";
import { useChartOfAccounts } from "@/features/business/hooks/useChartOfAccounts";
import { useProducts } from "@/features/business/hooks/useProducts";
import { PAGE_SIZE, usePurchasesQuery } from "@/features/business/hooks/usePurchasesQuery";
import { useSuppliers } from "@/features/business/hooks/useSuppliers";
import { useBusiness } from "@/hooks/useBusiness";
import { useToastStore } from "@/hooks/useToastStore";
import { supabase } from "@/lib/supabase/client";
import type { PaymentFormInput } from "@/lib/validations/saleInvoice";
import type { PurchaseBillFormInput } from "@/lib/validations/purchaseBill";
import type { Purchase } from "@/types";

export default function PurchasesPage() {
  const { activeBusiness } = useBusiness();
  const currency = activeBusiness?.currency ?? "TZS";
  const showToast = useToastStore((state) => state.showToast);
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const { accounts } = useChartOfAccounts();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [payingPurchase, setPayingPurchase] = useState<Purchase | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null);

  const filters = { search, dateFrom, dateTo, sortDir, page };
  const query = usePurchasesQuery(filters, refreshKey);
  const hasFilters = Boolean(search || dateFrom || dateTo);

  const handleClearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleCreateBill = async (values: PurchaseBillFormInput) => {
    if (!activeBusiness) return { error: "No active business." };
    const { error } = await supabase.rpc("create_purchase_bill", {
      p_business_id: activeBusiness.id,
      // See the matching comment in SalesPage.tsx — the generated RPC arg
      // types don't mark uuid/date params nullable even though the
      // function itself accepts null for an unset supplier/due-date.
      p_supplier_id: (values.supplierId || null) as unknown as string,
      p_bill_number: values.billNumber,
      p_bill_date: values.billDate,
      p_due_date: (values.dueDate || null) as unknown as string,
      p_notes: values.notes,
      p_lines: values.lines.map((l) => ({ product_id: l.productId, quantity: l.quantity, unit_price: l.unitPrice })),
    });
    if (error) return { error: error.message || "We couldn't save this bill." };
    setRefreshKey((k) => k + 1);
    showToast("Purchase bill recorded.");
  };

  const handleRecordPayment = async (values: PaymentFormInput) => {
    if (!payingPurchase) return { error: "No bill selected." };
    const { error } = await supabase.rpc("record_purchase_payment", {
      p_purchase_id: payingPurchase.id,
      p_payment_date: values.paymentDate,
      p_amount: values.amount,
      p_account_id: values.accountId,
    });
    if (error) return { error: error.message || "We couldn't record this payment." };
    setRefreshKey((k) => k + 1);
    setViewingPurchase(null);
    showToast("Payment recorded.");
  };

  const handleDelete = async () => {
    if (!deletingPurchase) return;
    const { error } = await supabase.from("purchases").delete().eq("id", deletingPurchase.id);
    setDeletingPurchase(null);
    if (error) {
      showToast(error.message.includes("payments recorded") ? "This bill has payments recorded and can't be deleted." : "We couldn't delete this bill.", "error");
      return;
    }
    setRefreshKey((k) => k + 1);
    showToast("Bill deleted.");
  };

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Bills you've received from suppliers."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New Bill
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search bill number or notes..." aria-label="Search" className="h-9 w-full rounded-lg border border-border-strong bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} aria-label="From date" className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none" />
          <span className="text-text-tertiary">–</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} aria-label="To date" className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none" />
          {hasFilters && (
            <button type="button" onClick={handleClearFilters} aria-label="Clear filters" className="flex size-9 items-center justify-center rounded-lg text-text-tertiary hover:bg-background">
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {query.error ? (
        <AlertBanner message={query.error} />
      ) : !query.loading && query.purchases.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={hasFilters ? "No matching bills" : "No purchases yet"}
          description={hasFilters ? "Try adjusting your search or filters." : "Record your first purchase bill from a supplier."}
          action={!hasFilters && <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="size-4" aria-hidden="true" />New Bill</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <PurchasesTable purchases={query.purchases} currency={currency} loading={query.loading} sortDir={sortDir} onToggleSort={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))} onView={setViewingPurchase} onDelete={setDeletingPurchase} />
          <Pagination page={page} pageSize={PAGE_SIZE} total={query.total} onPageChange={setPage} />
        </Card>
      )}

      <PurchaseBillFormModal open={formOpen} onClose={() => setFormOpen(false)} suppliers={suppliers} products={products} currency={currency} onSubmit={handleCreateBill} />

      <PurchaseDetailModal purchase={viewingPurchase} currency={currency} onClose={() => setViewingPurchase(null)} onRecordPayment={() => { setPayingPurchase(viewingPurchase); }} />

      <PaymentFormModal
        open={Boolean(payingPurchase)}
        onClose={() => setPayingPurchase(null)}
        title="Record Payment"
        remainingBalance={payingPurchase ? payingPurchase.total - payingPurchase.amountPaid : 0}
        currency={currency}
        accounts={accounts}
        onSubmit={handleRecordPayment}
      />

      <ConfirmDialog
        open={Boolean(deletingPurchase)}
        onClose={() => setDeletingPurchase(null)}
        onConfirm={handleDelete}
        title="Delete bill?"
        description="This will permanently delete this bill and reverse its journal entry. This can't be undone."
      />
    </div>
  );
}
