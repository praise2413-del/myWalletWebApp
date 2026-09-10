import { BookOpen, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { JournalEntryDetailModal } from "@/features/business/components/JournalEntryDetailModal";
import { JournalEntryFormModal } from "@/features/business/components/JournalEntryFormModal";
import { JournalEntriesTable } from "@/features/business/components/JournalEntriesTable";
import { useChartOfAccounts } from "@/features/business/hooks/useChartOfAccounts";
import { PAGE_SIZE, useJournalEntriesQuery } from "@/features/business/hooks/useJournalEntriesQuery";
import { useBusiness } from "@/hooks/useBusiness";
import { useToastStore } from "@/hooks/useToastStore";
import { supabase } from "@/lib/supabase/client";
import type { JournalEntryFormInput } from "@/lib/validations/journalEntry";
import type { JournalEntryWithLines } from "@/types";

export default function JournalEntriesPage() {
  const { activeBusiness } = useBusiness();
  const currency = activeBusiness?.currency ?? "TZS";
  const { accounts } = useChartOfAccounts();
  const showToast = useToastStore((state) => state.showToast);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<JournalEntryWithLines | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<JournalEntryWithLines | null>(null);

  const filters = { search, dateFrom, dateTo, sortDir, page };
  const query = useJournalEntriesQuery(filters, refreshKey);
  const hasFilters = Boolean(search || dateFrom || dateTo);

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };
  const handleClearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleSubmit = async (values: JournalEntryFormInput) => {
    if (!activeBusiness) return { error: "No active business." };

    const { error } = await supabase.rpc("create_journal_entry", {
      p_business_id: activeBusiness.id,
      p_entry_date: values.entryDate,
      p_description: values.description,
      p_reference: values.reference || "",
      p_lines: values.lines.map((line) => ({ account_id: line.accountId, debit: line.debit, credit: line.credit })),
    });

    if (error) {
      return { error: error.message || "We couldn't save this journal entry. Please try again." };
    }

    setRefreshKey((k) => k + 1);
    showToast("Journal entry recorded.");
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    const { error } = await supabase.from("journal_entries").delete().eq("id", deletingEntry.id);
    setDeletingEntry(null);
    if (error) {
      showToast("We couldn't delete this journal entry.", "error");
      return;
    }
    setRefreshKey((k) => k + 1);
    showToast("Journal entry deleted.");
  };

  return (
    <div>
      <PageHeader
        title="Journal Entries"
        description="Record balanced double-entry transactions against your chart of accounts."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New Journal Entry
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
            placeholder="Search description or reference..."
            aria-label="Search"
            className="h-9 w-full rounded-lg border border-border-strong bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="je-date-from">From date</label>
          <input
            id="je-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => handleFilterChange(setDateFrom)(e.target.value)}
            className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
          />
          <span className="text-text-tertiary">–</span>
          <label className="sr-only" htmlFor="je-date-to">To date</label>
          <input
            id="je-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => handleFilterChange(setDateTo)(e.target.value)}
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

      {query.error ? (
        <AlertBanner message={query.error} />
      ) : !query.loading && query.entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={hasFilters ? "No matching journal entries" : "No journal entries yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Record your first double-entry transaction against the chart of accounts."
          }
          action={
            !hasFilters && (
              <Button size="sm" className="mt-1" onClick={() => setFormOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                New Journal Entry
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <JournalEntriesTable
            entries={query.entries}
            currency={currency}
            loading={query.loading}
            sortDir={sortDir}
            onToggleSort={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            onView={setViewingEntry}
            onDelete={setDeletingEntry}
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={query.total} onPageChange={setPage} />
        </Card>
      )}

      <JournalEntryFormModal open={formOpen} onClose={() => setFormOpen(false)} accounts={accounts} currency={currency} onSubmit={handleSubmit} />

      <JournalEntryDetailModal entry={viewingEntry} currency={currency} onClose={() => setViewingEntry(null)} />

      <ConfirmDialog
        open={Boolean(deletingEntry)}
        onClose={() => setDeletingEntry(null)}
        onConfirm={handleDelete}
        title="Delete journal entry?"
        description="This will permanently delete this entry and all its lines. This can't be undone."
      />
    </div>
  );
}
