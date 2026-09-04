import { Bell, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationCard } from "@/features/notifications/components/NotificationCard";
import { useNotificationList } from "@/features/notifications/hooks/useNotificationList";
import { useNotificationsContext } from "@/hooks/useNotificationsContext";
import { cn } from "@/lib/utils/cn";

const DROPDOWN_LIMIT = 5;

function formatBadgeCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

function NotificationDropdownPanel({ onClose }: { onClose: () => void }) {
  const { notifications, loading, error, markAllAsRead, markAsRead } = useNotificationList({ limit: DROPDOWN_LIMIT });

  return (
    <div
      role="menu"
      aria-label="Notifications"
      // Fixed + viewport-anchored on mobile: `right-0` here is relative to
      // the bell's own small wrapper, which usually isn't at the screen's
      // right edge, so a near-full-width panel would clip off the left
      // side of the viewport. From `sm:` up there's room to anchor it to
      // the bell itself as usual.
      className="fixed inset-x-4 top-16 z-20 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-[var(--shadow-popover)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-text-primary">Notifications</p>
        {notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-500"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-text-tertiary" aria-hidden="true" />
          </div>
        ) : error ? (
          <p className="px-3 py-6 text-center text-sm text-text-tertiary">{error}</p>
        ) : notifications.length === 0 ? (
          <div className="py-4">
            <EmptyState icon={Bell} title="You're all caught up." description="No new notifications." />
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} onOpen={onClose} onMarkAsRead={markAsRead} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border p-2">
        <Link
          to="/notifications"
          onClick={onClose}
          className="block rounded-lg bg-primary-50 px-3 py-2 text-center text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:text-primary-500"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { unreadCount } = useNotificationsContext();
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
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative flex size-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
      >
        <Bell className="size-[18px]" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-1 top-1 flex items-center justify-center rounded-full bg-expense-600 font-semibold text-white ring-2 ring-surface",
              unreadCount > 9 ? "h-4 min-w-4 px-1 text-[9px]" : "size-4 text-[10px]",
            )}
          >
            {formatBadgeCount(unreadCount)}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <NotificationDropdownPanel onClose={() => setOpen(false)} />
        </>
      )}
    </div>
  );
}
