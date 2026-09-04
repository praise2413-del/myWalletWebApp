import { useEffect, useState } from "react";
import {
  clearNotificationHistory,
  listNotifications,
  markAllAsRead as markAllAsReadApi,
  markAsRead as markAsReadApi,
  softDeleteNotification,
  type NotificationTab,
} from "@/features/notifications/lib/notificationsApi";
import { useNotificationsContext } from "@/hooks/useNotificationsContext";
import { useToastStore } from "@/hooks/useToastStore";
import type { Notification } from "@/types";

export interface UseNotificationListOptions {
  limit: number;
  tab?: NotificationTab;
  search?: string;
}

/**
 * Fetches a page of notifications and exposes optimistic actions
 * (mark-as-read / mark-all / delete / clear-history) with rollback on
 * failure. Refetches whenever the shared NotificationsProvider signals a
 * realtime change, so this never needs its own subscription.
 */
export function useNotificationList({ limit, tab = "all", search = "" }: UseNotificationListOptions) {
  const { lastChangeAt } = useNotificationsContext();
  const { showToast } = useToastStore();

  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // A tab switch or new search term starts a fresh result set.
  useEffect(() => {
    setPage(1);
  }, [tab, search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    listNotifications({ limit, offset: (page - 1) * limit, tab, search }).then((res) => {
      if (!active) return;
      if (res.error || !res.data) {
        setError(res.error ?? "We couldn't load your notifications.");
      } else {
        setNotifications(res.data.notifications);
        setTotalCount(res.data.totalCount);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [limit, page, tab, search, lastChangeAt, retryToken]);

  async function markAsRead(id: string) {
    const previous = notifications;
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)));

    const { error: err } = await markAsReadApi(id);
    if (err) {
      setNotifications(previous);
      showToast(err, "error");
    }
  }

  async function markAllAsRead() {
    const previous = notifications;
    setNotifications((list) => list.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })));

    const { error: err } = await markAllAsReadApi();
    if (err) {
      setNotifications(previous);
      showToast(err, "error");
    }
  }

  async function deleteNotification(id: string) {
    const previous = notifications;
    const previousCount = totalCount;
    setNotifications((list) => list.filter((n) => n.id !== id));
    setTotalCount((c) => Math.max(0, c - 1));

    const { error: err } = await softDeleteNotification(id);
    if (err) {
      setNotifications(previous);
      setTotalCount(previousCount);
      showToast(err, "error");
    }
  }

  async function clearHistory() {
    const previous = notifications;
    const previousCount = totalCount;
    setNotifications([]);
    setTotalCount(0);

    const { error: err } = await clearNotificationHistory();
    if (err) {
      setNotifications(previous);
      setTotalCount(previousCount);
      showToast(err, "error");
    }
  }

  return {
    notifications,
    totalCount,
    loading,
    error,
    page,
    setPage,
    retry: () => setRetryToken((t) => t + 1),
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearHistory,
  };
}
