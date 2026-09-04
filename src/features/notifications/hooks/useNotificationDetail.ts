import { useEffect, useState } from "react";
import { fetchNotification, markAsRead as markAsReadApi, softDeleteNotification } from "@/features/notifications/lib/notificationsApi";
import { useNotificationsContext } from "@/hooks/useNotificationsContext";
import { useToastStore } from "@/hooks/useToastStore";
import type { Notification } from "@/types";

export function useNotificationDetail(id: string) {
  const { lastChangeAt } = useNotificationsContext();
  const { showToast } = useToastStore();

  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchNotification(id).then((res) => {
      if (!active) return;
      if (res.error || !res.data) setError(res.error ?? "This notification couldn't be found.");
      else setNotification(res.data);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id, lastChangeAt, retryToken]);

  async function markAsRead() {
    if (!notification || notification.isRead) return;
    const previous = notification;
    setNotification({ ...notification, isRead: true, readAt: new Date().toISOString() });

    const { error: err } = await markAsReadApi(id);
    if (err) {
      setNotification(previous);
      showToast(err, "error");
    }
  }

  /** Returns whether the delete succeeded, so the page can navigate away only on success. */
  async function deleteNotification(): Promise<boolean> {
    const { error: err } = await softDeleteNotification(id);
    if (err) {
      showToast(err, "error");
      return false;
    }
    return true;
  }

  return {
    notification,
    loading,
    error,
    retry: () => setRetryToken((t) => t + 1),
    markAsRead,
    deleteNotification,
  };
}
