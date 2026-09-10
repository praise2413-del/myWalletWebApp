import { History } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useActivityLog } from "@/features/business/hooks/useActivityLog";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function ActivityLogView() {
  const { entries, loading, error } = useActivityLog();

  if (error) return <p className="text-sm text-expense-600">{error}</p>;
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (entries.length === 0) {
    return <EmptyState icon={History} title="No activity yet" description="Journal entries, sales, purchases, payments, and team changes will show up here." />;
  }

  return (
    <Card className="divide-y divide-border overflow-hidden">
      {entries.map((entry) => (
        <div key={entry.id} className="px-5 py-3.5">
          <p className="text-sm text-text-primary">{entry.description}</p>
          <p className="mt-0.5 text-xs text-text-tertiary">
            {entry.actorEmail ?? "System"} · {formatDateTime(entry.createdAt)}
          </p>
        </div>
      ))}
    </Card>
  );
}
