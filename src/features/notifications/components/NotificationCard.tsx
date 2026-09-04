import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { relativeNotificationTime } from "@/features/notifications/lib/notificationFormat";
import { getNotificationVisual } from "@/features/notifications/lib/notificationVisuals";
import { cn } from "@/lib/utils/cn";
import type { Notification } from "@/types";

interface NotificationCardProps {
  notification: Notification;
  /** The full Notifications page shows a drill-in chevron; the compact dropdown doesn't. */
  showChevron?: boolean;
  onOpen?: () => void;
  onMarkAsRead: (id: string) => void;
}

export function NotificationCard({ notification, showChevron = false, onOpen, onMarkAsRead }: NotificationCardProps) {
  const visual = getNotificationVisual(notification.type);
  const Icon = visual.icon;

  return (
    <Link
      to={`/notifications/${notification.id}`}
      onClick={() => {
        if (!notification.isRead) onMarkAsRead(notification.id);
        onOpen?.();
      }}
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-background",
        !notification.isRead && "bg-primary-50/70 dark:bg-primary-950/30",
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", visual.iconBgClassName)}>
        <Icon className={cn("size-[18px]", visual.iconColorClassName)} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {!notification.isRead && (
              <span className={cn("size-1.5 shrink-0 rounded-full", visual.dotClassName)} aria-hidden="true" />
            )}
            <p className={cn("truncate text-sm text-text-primary", notification.isRead ? "font-medium" : "font-semibold")}>
              {notification.title}
              {!notification.isRead && <span className="sr-only"> (unread)</span>}
            </p>
          </div>
          <span className="shrink-0 text-xs text-text-tertiary">{relativeNotificationTime(notification.createdAt)}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-text-secondary">{notification.message}</p>
      </div>

      {showChevron && <ChevronRight className="mt-2.5 size-4 shrink-0 text-text-tertiary" aria-hidden="true" />}
    </Link>
  );
}
