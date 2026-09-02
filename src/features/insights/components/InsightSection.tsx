import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InsightCard } from "@/features/insights/components/InsightCard";
import type { Insight } from "@/types";

interface InsightSectionProps {
  title: string;
  description: string;
  insights: Insight[];
  emptyMessage: string;
  extra?: ReactNode;
}

export function InsightSection({ title, description, insights, emptyMessage, extra }: InsightSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-tertiary">{emptyMessage}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
        {extra}
      </CardContent>
    </Card>
  );
}
