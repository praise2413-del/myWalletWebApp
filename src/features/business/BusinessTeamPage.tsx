import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActivityLogView } from "@/features/business/components/team/ActivityLogView";
import { TeamView } from "@/features/business/components/team/TeamView";
import { cn } from "@/lib/utils/cn";

type Tab = "TEAM" | "ACTIVITY";

const TABS: { id: Tab; label: string }[] = [
  { id: "TEAM", label: "Team" },
  { id: "ACTIVITY", label: "Activity Log" },
];

export default function BusinessTeamPage() {
  const [tab, setTab] = useState<Tab>("TEAM");

  return (
    <div>
      <PageHeader title="Team" description="Who has access to this business, and a record of significant activity." />

      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t.id ? "bg-primary-600 text-white" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "TEAM" && <TeamView />}
      {tab === "ACTIVITY" && <ActivityLogView />}
    </div>
  );
}
