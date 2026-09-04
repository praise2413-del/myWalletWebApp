import { Bell, CheckCheck, MoreVertical, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { NotificationCard } from "@/features/notifications/components/NotificationCard";
import { useNotificationCounts } from "@/features/notifications/hooks/useNotificationCounts";
import { useNotificationList } from "@/features/notifications/hooks/useNotificationList";
import type { NotificationTab } from "@/features/notifications/lib/notificationsApi";
import { cn } from "@/lib/utils/cn";

const PAGE_SIZE = 12;

const TABS: { value: NotificationTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "reports", label: "Reports" },
  { value: "security", label: "Security" },
  { value: "insights", label: "Insights" },
];

function NotificationsMenu({ onMarkAllAsRead, onClearHistory }: { onMarkAllAsRead: () => void; onClearHistory: () => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notification options"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-strong text-text-secondary hover:bg-background hover:text-text-primary"
      >
        <MoreVertical className="size-[18px]" aria-hidden="true" />
      </button>

      {open && (
        <>
          <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-[var(--shadow-popover)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onMarkAllAsRead();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              Mark all as read
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onClearHistory();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-expense-600 transition-colors hover:bg-background"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Clear history
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<NotificationTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const counts = useNotificationCounts();
  const {
    notifications,
    totalCount,
    loading,
    error,
    page,
    setPage,
    retry,
    markAsRead,
    markAllAsRead,
    clearHistory,
  } = useNotificationList({ limit: PAGE_SIZE, tab, search });

  // Debounce the search box so every keystroke doesn't fire a query.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Notifications</h1>
          <p className="mt-1 text-sm text-text-secondary">Stay updated with important information about your finances.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search notifications..."
              aria-label="Search notifications"
              className="h-9 w-full rounded-lg border border-border-strong bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none sm:w-56"
            />
          </div>
          <NotificationsMenu onMarkAllAsRead={markAllAsRead} onClearHistory={() => setConfirmClearOpen(true)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-border pb-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t.value ? "bg-primary-600 text-white" : "bg-surface text-text-secondary hover:bg-background",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                tab === t.value ? "bg-white/20 text-white" : "bg-background text-text-tertiary",
              )}
            >
              {counts[t.value === "all" ? "all" : t.value]}
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <div className="space-y-4">
          <AlertBanner message={error} />
          <Button variant="outline" onClick={retry}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up." description="No new notifications." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div key={n.id} className="px-2">
                <NotificationCard notification={n} showChevron onMarkAsRead={markAsRead} />
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={totalCount} onPageChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={async () => {
          await clearHistory();
          setConfirmClearOpen(false);
        }}
        title="Clear notification history?"
        description="Are you sure you want to clear your notification history? This can't be undone."
        confirmLabel="Clear history"
      />
    </div>
  );
}
