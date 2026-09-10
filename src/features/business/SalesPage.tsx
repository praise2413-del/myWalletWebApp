import { FileText, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { PaymentFormModal } from "@/features/business/components/PaymentFormModal";
import { SaleDetailModal } from "@/features/business/components/SaleDetailModal";
import { SaleInvoiceFormModal } from "@/features/business/components/SaleInvoiceFormModal";
import { SalesTable } from "@/features/business/components/SalesTable";
import { useChartOfAccounts } from "@/features/business/hooks/useChartOfAccounts";
import { useCustomers } from "@/features/business/hooks/useCustomers";
import { useProducts } from "@/features/business/hooks/useProducts";
import { PAGE_SIZE, useSalesQuery } from "@/features/business/hooks/useSalesQuery";
import { useBusiness } from "@/hooks/useBusiness";
import { useToastStore } from "@/hooks/useToastStore";
import { supabase } from "@/lib/supabase/client";
import type { PaymentFormInput, SaleInvoiceFormInput } from "@/lib/validations/saleInvoice";
import type { Sale } from "@/types";

export default function SalesPage() {
  const { activeBusiness } = useBusiness();
  const currency = activeBusiness?.currency ?? "TZS";
  const showToast = useToastStore((state) => state.showToast);
  const { customers } = useCustomers();
  const { products } = useProducts();
  const { accounts } = useChartOfAccounts();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [payingSale, setPayingSale] = useState<Sale | null>(null);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);

  const filters = { search, dateFrom, dateTo, sortDir, page };
  const query = useSalesQuery(filters, refreshKey);
  const hasFilters = Boolean(search || dateFrom || dateTo);

  const handleClearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleCreateInvoice = async (values: SaleInvoiceFormInput) => {
    if (!activeBusiness) return { error: "No active business." };
    const { error } = await supabase.rpc("create_sale_invoice", {
      p_business_id: activeBusiness.id,
      // The generated RPC arg types don't mark uuid/date params nullable
      // even though the function itself accepts null for an unset
      // customer/due-date — cast at the call site rather than widen the
      // generated types.
      p_customer_id: (values.customerId || null) as unknown as string,
      p_invoice_number: values.invoiceNumber,
      p_invoice_date: values.invoiceDate,
      p_due_date: (values.dueDate || null) as unknown as string,
      p_notes: values.notes,
      p_lines: values.lines.map((l) => ({ product_id: l.productId, quantity: l.quantity, unit_price: l.unitPrice })),
    });
    if (error) return { error: error.message || "We couldn't save this invoice." };
    setRefreshKey((k) => k + 1);
    showToast("Sale invoice recorded.");
  };

  const handleRecordPayment = async (values: PaymentFormInput) => {
    if (!payingSale) return { error: "No invoice selected." };
    const { error } = await supabase.rpc("record_sale_payment", {
      p_sale_id: payingSale.id,
      p_payment_date: values.paymentDate,
      p_amount: values.amount,
      p_account_id: values.accountId,
    });
    if (error) return { error: error.message || "We couldn't record this payment." };
    setRefreshKey((k) => k + 1);
    setViewingSale(null);
    showToast("Payment recorded.");
  };

  const handleDelete = async () => {
    if (!deletingSale) return;
    const { error } = await supabase.from("sales").delete().eq("id", deletingSale.id);
    setDeletingSale(null);
    if (error) {
      showToast(error.message.includes("payments recorded") ? "This invoice has payments recorded and can't be deleted." : "We couldn't delete this invoice.", "error");
      return;
    }
    setRefreshKey((k) => k + 1);
    showToast("Invoice deleted.");
  };

  return (
    <div>
      <PageHeader
        title="Sales"
        description="Invoices you've issued to customers."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New Invoice
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search invoice number or notes..." aria-label="Search" className="h-9 w-full rounded-lg border border-border-strong bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none" />
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
      ) : !query.loading && query.sales.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={hasFilters ? "No matching invoices" : "No sales yet"}
          description={hasFilters ? "Try adjusting your search or filters." : "Create your first sale invoice to a customer."}
          action={!hasFilters && <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="size-4" aria-hidden="true" />New Invoice</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <SalesTable sales={query.sales} currency={currency} loading={query.loading} sortDir={sortDir} onToggleSort={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))} onView={setViewingSale} onDelete={setDeletingSale} />
          <Pagination page={page} pageSize={PAGE_SIZE} total={query.total} onPageChange={setPage} />
        </Card>
      )}

      <SaleInvoiceFormModal open={formOpen} onClose={() => setFormOpen(false)} customers={customers} products={products} currency={currency} onSubmit={handleCreateInvoice} />

      <SaleDetailModal sale={viewingSale} currency={currency} onClose={() => setViewingSale(null)} onRecordPayment={() => { setPayingSale(viewingSale); }} />

      <PaymentFormModal
        open={Boolean(payingSale)}
        onClose={() => setPayingSale(null)}
        title="Record Payment"
        remainingBalance={payingSale ? payingSale.total - payingSale.amountPaid : 0}
        currency={currency}
        accounts={accounts}
        onSubmit={handleRecordPayment}
      />

      <ConfirmDialog
        open={Boolean(deletingSale)}
        onClose={() => setDeletingSale(null)}
        onConfirm={handleDelete}
        title="Delete invoice?"
        description="This will permanently delete this invoice and reverse its journal entry. This can't be undone."
      />
    </div>
  );
}
