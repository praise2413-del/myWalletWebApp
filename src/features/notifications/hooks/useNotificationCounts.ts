import { useEffect, useState } from "react";
import { fetchNotificationCounts, type NotificationCounts } from "@/features/notifications/lib/notificationsApi";
import { useNotificationsContext } from "@/hooks/useNotificationsContext";

const EMPTY_COUNTS: NotificationCounts = { all: 0, unread: 0, reports: 0, security: 0, insights: 0 };

/** Powers the filter-tab counts on the Notifications page. Kept separate from useNotificationList so a page/search change doesn't re-run these. */
export function useNotificationCounts() {
  const { lastChangeAt } = useNotificationsContext();
  const [counts, setCounts] = useState<NotificationCounts>(EMPTY_COUNTS);

  useEffect(() => {
    let active = true;
    fetchNotificationCounts().then((c) => {
      if (active) setCounts(c);
    });
    return () => {
      active = false;
    };
  }, [lastChangeAt]);

  return counts;
}
