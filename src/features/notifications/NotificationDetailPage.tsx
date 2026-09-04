import { format } from "date-fns";
import { Calendar, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { weeklyReportPeriodLabel } from "@/features/notifications/lib/notificationFormat";
import { getNotificationVisual } from "@/features/notifications/lib/notificationVisuals";
import { useNotificationDetail } from "@/features/notifications/hooks/useNotificationDetail";

const REPORT_DETAIL_COPY =
  "This report includes your income, expenses, savings, investments, charts, and personalized insights.";

function reportUrl(periodStart: string, periodEnd: string): string {
  const params = new URLSearchParams({ period: "custom", start: periodStart, end: periodEnd, openReport: "1" });
  return `/reports?${params.toString()}`;
}

export default function NotificationDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notification, loading, error, retry, markAsRead, deleteNotification } = useNotificationDetail(id);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const ok = await deleteNotification();
    setDeleting(false);
    if (ok) navigate("/notifications", { replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/notifications"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to notifications
      </Link>

      {error ? (
        <div className="space-y-4">
          <AlertBanner message={error} />
          <Button variant="outline" onClick={retry}>
            Retry
          </Button>
        </div>
      ) : loading || !notification ? (
        <div className="space-y-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <NotificationDetailContent
          notification={notification}
          onMarkAsRead={markAsRead}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}

function NotificationDetailContent({
  notification,
  onMarkAsRead,
  onDelete,
  deleting,
}: {
  notification: NonNullable<ReturnType<typeof useNotificationDetail>["notification"]>;
  onMarkAsRead: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const visual = getNotificationVisual(notification.type);
  const Icon = visual.icon;
  const isWeeklyReport = notification.type === "WEEKLY_REPORT";
  const hasPeriod = isWeeklyReport && notification.periodStart && notification.periodEnd;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${visual.iconBgClassName}`}>
          <Icon className={`size-6 ${visual.iconColorClassName}`} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-text-primary sm:text-xl">{notification.title}</h1>
            {!notification.isRead && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-500">
                <span className="size-1.5 rounded-full bg-primary-500" aria-hidden="true" />
                Unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-tertiary">{format(new Date(notification.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-text-secondary">{notification.message}</p>
      {isWeeklyReport && <p className="mt-2 text-sm leading-relaxed text-text-tertiary">{REPORT_DETAIL_COPY}</p>}

      {hasPeriod && notification.periodStart && notification.periodEnd && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
            <Calendar className="size-4 text-primary-600 dark:text-primary-500" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-medium text-text-secondary">Report Period</p>
            <p className="text-sm font-semibold text-text-primary">
              {weeklyReportPeriodLabel(notification.periodStart, notification.periodEnd)}
            </p>
            <p className="text-xs text-text-tertiary">Monday – Sunday</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {hasPeriod && notification.periodStart && notification.periodEnd && (
          <Link to={reportUrl(notification.periodStart, notification.periodEnd)}>
            <Button>View Report</Button>
          </Link>
        )}
        {!notification.isRead && (
          <Button variant="outline" onClick={onMarkAsRead}>
            Mark as read
          </Button>
        )}
        <Button variant="outline" onClick={onDelete} disabled={deleting} className="text-expense-600 hover:text-expense-700">
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
