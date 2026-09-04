import { useEffect, useState } from "react";
import { NotificationsContext } from "@/app/providers/notificationsContext";
import { useAuth } from "@/hooks/useAuth";
import { fetchUnreadCount } from "@/features/notifications/lib/notificationsApi";
import { supabase } from "@/lib/supabase/client";

/**
 * Owns the single realtime subscription to `notifications` for the whole
 * session — mounted once in AppShell, rather than each notification
 * component (bell, dropdown, full page) holding its own channel.
 *
 * Exposes only the unread count and a `lastChangeAt` signal; the actual
 * list content is fetched independently by whichever component needs it
 * (see useNotificationList), refetching when `lastChangeAt` changes.
 */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChangeAt, setLastChangeAt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetchUnreadCount().then((count) => {
      if (active) {
        setUnreadCount(count);
        setLoading(false);
      }
    });

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          if (!active) return;
          setLastChangeAt(Date.now());
          fetchUnreadCount().then((count) => {
            if (active) setUnreadCount(count);
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, lastChangeAt, loading }}>{children}</NotificationsContext.Provider>
  );
}
