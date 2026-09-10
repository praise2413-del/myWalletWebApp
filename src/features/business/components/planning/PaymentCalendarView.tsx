import { differenceInCalendarDays } from "date-fns";
import { CalendarClock } from "lucide-react";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useUpcomingPayments, type UpcomingPayment } from "@/features/business/hooks/useUpcomingPayments";
import { useBusiness } from "@/hooks/useBusiness";
import { formatCurrency } from "@/lib/utils/currency";

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function urgencyLabel(dueDate: string): { label: string; tone: "expense" | "warning" | "neutral" } {
  const days = differenceInCalendarDays(new Date(`${dueDate}T00:00:00`), new Date(new Date().toDateString()));
  if (days < 0) return { label: "Overdue", tone: "expense" };
  if (days <= 7) return { label: "Due this week", tone: "warning" };
  return { label: "Upcoming", tone: "neutral" };
}

function Row({ payment, currency }: { payment: UpcomingPayment; currency: string }) {
  const urgency = urgencyLabel(payment.dueDate);
  const isReceivable = payment.kind === "RECEIVABLE";
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-text-primary">{payment.counterpartyName}</p>
          <Badge tone={urgency.tone}>{urgency.label}</Badge>
        </div>
        <p className="text-xs text-text-tertiary">
          {isReceivable ? "To receive" : "To pay"} · Due {formatDate(payment.dueDate)}
          {payment.reference && ` · ${payment.reference}`}
        </p>
      </div>
      <p className={`shrink-0 text-sm font-semibold ${isReceivable ? "text-income-600" : "text-expense-600"}`}>
        {isReceivable ? "+" : "-"}
        {formatCurrency(payment.remaining, currency)}
      </p>
    </div>
  );
}

export function PaymentCalendarView() {
  const { activeBusiness } = useBusiness();
  const currency = activeBusiness?.currency ?? "TZS";
  const { payments, loading, error } = useUpcomingPayments();

  if (error) return <AlertBanner message={error} />;
  if (loading) return <Skeleton className="h-40 w-full" />;
  if (payments.length === 0) {
    return <EmptyState icon={CalendarClock} title="No upcoming payments" description="Invoices and bills with a due date and an outstanding balance will show up here." />;
  }

  const totalReceivable = payments.filter((p) => p.kind === "RECEIVABLE").reduce((sum, p) => sum + p.remaining, 0);
  const totalPayable = payments.filter((p) => p.kind === "PAYABLE").reduce((sum, p) => sum + p.remaining, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-text-secondary">Total to Receive</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-income-600">{formatCurrency(totalReceivable, currency)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-text-secondary">Total to Pay</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-expense-600">{formatCurrency(totalPayable, currency)}</p>
        </Card>
      </div>

      <Card className="divide-y divide-border overflow-hidden">
        {payments.map((p) => (
          <Row key={`${p.kind}-${p.id}`} payment={p} currency={currency} />
        ))}
      </Card>
    </div>
  );
}
