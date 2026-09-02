import { Plus, Search, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useToastStore } from "@/hooks/useToastStore";
import { AllocationFormModal } from "@/features/transactions/components/AllocationFormModal";
import { AllocationsTable } from "@/features/transactions/components/AllocationsTable";
import { TransactionFormModal } from "@/features/transactions/components/TransactionFormModal";
import { TransactionsTable } from "@/features/transactions/components/TransactionsTable";
import {
  PAGE_SIZE as ALLOCATION_PAGE_SIZE,
  useAllocationsQuery,
} from "@/features/transactions/hooks/useAllocationsQuery";
import {
  PAGE_SIZE as TRANSACTION_PAGE_SIZE,
  useTransactionsQuery,
} from "@/features/transactions/hooks/useTransactionsQuery";
import { supabase } from "@/lib/supabase/client";
import { friendlyDbError } from "@/lib/utils/dbErrors";
import { cn } from "@/lib/utils/cn";
import type { AllocationFormInput, TransactionFormInput } from "@/lib/validations/transaction";
import type { Allocation, AllocationType, Transaction, TransactionType } from "@/types";

type Tab = "ALL" | "INCOME" | "EXPENSE" | "ALLOCATION";

const TABS: { id: Tab; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "INCOME", label: "Income" },
  { id: "EXPENSE", label: "Expense" },
  { id: "ALLOCATION", label: "Savings & Investment" },
];

export default function TransactionsPage() {
  const { user, profile } = useAuth();
  const currency = profile?.currency ?? "TZS";
  const showToast = useToastStore((state) => state.showToast);
  const { categories } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState<Tab>("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [txFormOpen, setTxFormOpen] = useState(false);
  const [txFormType, setTxFormType] = useState<TransactionType>("EXPENSE");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const [allocFormOpen, setAllocFormOpen] = useState(false);
  const [allocFormType, setAllocFormType] = useState<AllocationType>("SAVING");
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
  const [deletingAllocation, setDeletingAllocation] = useState<Allocation | null>(null);

  useEffect(() => {
    const newParam = searchParams.get("new");
    if (newParam === "income") {
      setTxFormType("INCOME");
      setTxFormOpen(true);
    } else if (newParam === "expense") {
      setTxFormType("EXPENSE");
      setTxFormOpen(true);
    } else if (newParam === "saving") {
      setAllocFormType("SAVING");
      setAllocFormOpen(true);
    } else if (newParam === "investment") {
      setAllocFormType("INVESTMENT");
      setAllocFormOpen(true);
    }
    if (newParam) {
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // Intentionally mount-only: consumes the URL's one-shot "new" param, then clears it.
  }, [searchParams, setSearchParams]);

  const handleTabChange = (nextTab: Tab) => {
    setTab(nextTab);
    setPage(1);
  };
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setPage(1);
  };
  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setPage(1);
  };
  const handleClearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const transactionFilters = useMemo(
    () => ({
      type: (tab === "ALL" || tab === "ALLOCATION" ? "ALL" : tab) as TransactionType | "ALL",
      search,
      dateFrom,
      dateTo,
      sortDir,
      page,
    }),
    [tab, search, dateFrom, dateTo, sortDir, page],
  );
  const allocationFilters = useMemo(
    () => ({ type: "ALL" as const, search, dateFrom, dateTo, sortDir, page }),
    [search, dateFrom, dateTo, sortDir, page],
  );

  const txQuery = useTransactionsQuery(transactionFilters, refreshKey);
  const allocQuery = useAllocationsQuery(allocationFilters, refreshKey);

  const isAllocationTab = tab === "ALLOCATION";
  const hasFilters = Boolean(search || dateFrom || dateTo);

  const handleTransactionSubmit = async (values: TransactionFormInput) => {
    if (!user) return { error: "You must be signed in." };

    const payload = {
      user_id: user.id,
      category_id: values.categoryId,
      type: values.type,
      amount: values.amount,
      transaction_date: values.transactionDate,
      note: values.note?.trim() || null,
    };

    const { error } = editingTransaction
      ? await supabase.from("transactions").update(payload).eq("id", editingTransaction.id).eq("user_id", user.id)
      : await supabase.from("transactions").insert(payload);

    if (error) {
      return { error: friendlyDbError(error.message, "We couldn't save this transaction. Please try again.") };
    }

    setRefreshKey((k) => k + 1);
    setEditingTransaction(null);
    showToast(editingTransaction ? "Transaction updated." : "Transaction added successfully.");
  };

  const handleAllocationSubmit = async (values: AllocationFormInput) => {
    if (!user) return { error: "You must be signed in." };

    const payload = {
      user_id: user.id,
      type: values.type,
      amount: values.amount,
      allocation_date: values.allocationDate,
      note: values.note?.trim() || null,
    };

    const { error } = editingAllocation
      ? await supabase.from("allocations").update(payload).eq("id", editingAllocation.id).eq("user_id", user.id)
      : await supabase.from("allocations").insert(payload);

    if (error) {
      return { error: friendlyDbError(error.message, "We couldn't save this record. Please try again.") };
    }

    setRefreshKey((k) => k + 1);
    setEditingAllocation(null);
    showToast(editingAllocation ? "Allocation updated." : "Allocation added successfully.");
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction || !user) return;
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", deletingTransaction.id)
      .eq("user_id", user.id);
    setDeletingTransaction(null);
    if (error) {
      showToast("We couldn't delete this transaction.", "error");
      return;
    }
    setRefreshKey((k) => k + 1);
    showToast("Transaction deleted.");
  };

  const handleDeleteAllocation = async () => {
    if (!deletingAllocation || !user) return;
    const { error } = await supabase
      .from("allocations")
      .delete()
      .eq("id", deletingAllocation.id)
      .eq("user_id", user.id);
    setDeletingAllocation(null);
    if (error) {
      showToast("We couldn't delete this record.", "error");
      return;
    }
    setRefreshKey((k) => k + 1);
    showToast("Allocation deleted.");
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Manage your income, expenses, and savings & investment allocations"
        actions={
          isAllocationTab ? (
            <Button
              onClick={() => {
                setEditingAllocation(null);
                setAllocFormType("SAVING");
                setAllocFormOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add Allocation
            </Button>
          ) : (
            <Button
              onClick={() => {
                setEditingTransaction(null);
                setTxFormType(tab === "INCOME" ? "INCOME" : "EXPENSE");
                setTxFormOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add Transaction
            </Button>
          )
        }
      />

      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTabChange(t.id)}
            className={cn(
              "whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t.id ? "bg-primary-600 text-white" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={isAllocationTab ? "Search notes..." : "Search notes or categories..."}
            aria-label="Search"
            className="h-9 w-full rounded-lg border border-border-strong bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="date-from">
            From date
          </label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
          />
          <span className="text-text-tertiary">–</span>
          <label className="sr-only" htmlFor="date-to">
            To date
          </label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              aria-label="Clear filters"
              className="flex size-9 items-center justify-center rounded-lg text-text-tertiary hover:bg-background"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {isAllocationTab ? (
        <AllocationSection
          query={allocQuery}
          currency={currency}
          sortDir={sortDir}
          hasFilters={hasFilters}
          onToggleSort={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          onEdit={(a) => {
            setEditingAllocation(a);
            setAllocFormType(a.type);
            setAllocFormOpen(true);
          }}
          onDelete={setDeletingAllocation}
          onAddFirst={() => {
            setEditingAllocation(null);
            setAllocFormOpen(true);
          }}
          page={page}
          onPageChange={setPage}
        />
      ) : (
        <TransactionSection
          query={txQuery}
          currency={currency}
          sortDir={sortDir}
          hasFilters={hasFilters}
          onToggleSort={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          onEdit={(t) => {
            setEditingTransaction(t);
            setTxFormType(t.type);
            setTxFormOpen(true);
          }}
          onDelete={setDeletingTransaction}
          onAddFirst={() => {
            setEditingTransaction(null);
            setTxFormOpen(true);
          }}
          page={page}
          onPageChange={setPage}
        />
      )}

      <TransactionFormModal
        open={txFormOpen}
        onClose={() => {
          setTxFormOpen(false);
          setEditingTransaction(null);
        }}
        categories={categories}
        currency={currency}
        initialType={txFormType}
        editingTransaction={editingTransaction}
        onSubmit={handleTransactionSubmit}
      />

      <AllocationFormModal
        open={allocFormOpen}
        onClose={() => {
          setAllocFormOpen(false);
          setEditingAllocation(null);
        }}
        currency={currency}
        initialType={allocFormType}
        editingAllocation={editingAllocation}
        onSubmit={handleAllocationSubmit}
      />

      <ConfirmDialog
        open={Boolean(deletingTransaction)}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleDeleteTransaction}
        title="Delete transaction?"
        description={`This will permanently delete this ${deletingTransaction?.type === "INCOME" ? "income" : "expense"} record. This can't be undone.`}
      />

      <ConfirmDialog
        open={Boolean(deletingAllocation)}
        onClose={() => setDeletingAllocation(null)}
        onConfirm={handleDeleteAllocation}
        title="Delete allocation?"
        description="This will permanently delete this savings/investment record. This can't be undone."
      />
    </div>
  );
}

interface TransactionSectionProps {
  query: ReturnType<typeof useTransactionsQuery>;
  currency: string;
  sortDir: "asc" | "desc";
  hasFilters: boolean;
  onToggleSort: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  onAddFirst: () => void;
  page: number;
  onPageChange: (page: number) => void;
}

function TransactionSection({
  query,
  currency,
  sortDir,
  hasFilters,
  onToggleSort,
  onEdit,
  onDelete,
  onAddFirst,
  page,
  onPageChange,
}: TransactionSectionProps) {
  if (query.error) return <AlertBanner message={query.error} />;

  if (!query.loading && query.transactions.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title={hasFilters ? "No matching transactions" : "No transactions yet"}
        description={
          hasFilters
            ? "Try adjusting your search or filters."
            : "Add your first income or expense to start understanding your finances."
        }
        action={
          !hasFilters && (
            <Button size="sm" className="mt-1" onClick={onAddFirst}>
              <Plus className="size-4" aria-hidden="true" />
              Add Transaction
            </Button>
          )
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <TransactionsTable
        transactions={query.transactions}
        currency={currency}
        loading={query.loading}
        sortDir={sortDir}
        onToggleSort={onToggleSort}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <Pagination page={page} pageSize={TRANSACTION_PAGE_SIZE} total={query.total} onPageChange={onPageChange} />
    </Card>
  );
}

interface AllocationSectionProps {
  query: ReturnType<typeof useAllocationsQuery>;
  currency: string;
  sortDir: "asc" | "desc";
  hasFilters: boolean;
  onToggleSort: () => void;
  onEdit: (a: Allocation) => void;
  onDelete: (a: Allocation) => void;
  onAddFirst: () => void;
  page: number;
  onPageChange: (page: number) => void;
}

function AllocationSection({
  query,
  currency,
  sortDir,
  hasFilters,
  onToggleSort,
  onEdit,
  onDelete,
  onAddFirst,
  page,
  onPageChange,
}: AllocationSectionProps) {
  if (query.error) return <AlertBanner message={query.error} />;

  if (!query.loading && query.allocations.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title={hasFilters ? "No matching records" : "No savings or investment recorded yet"}
        description={
          hasFilters
            ? "Try adjusting your search or filters."
            : "Record money you're setting aside as savings or investing — it's tracked separately from your expenses."
        }
        action={
          !hasFilters && (
            <Button size="sm" className="mt-1" onClick={onAddFirst}>
              <Plus className="size-4" aria-hidden="true" />
              Add Allocation
            </Button>
          )
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <AllocationsTable
        allocations={query.allocations}
        currency={currency}
        loading={query.loading}
        sortDir={sortDir}
        onToggleSort={onToggleSort}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <Pagination page={page} pageSize={ALLOCATION_PAGE_SIZE} total={query.total} onPageChange={onPageChange} />
    </Card>
  );
}
