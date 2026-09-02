import { Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface FinancialInsightCardProps {
  title?: string;
  body?: string;
}

export function FinancialInsightCard({ title, body }: FinancialInsightCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Financial Insight</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary-50">
          <Lightbulb className="size-5 text-primary-600 dark:text-primary-500" aria-hidden="true" />
        </div>
        {title && body ? (
          <>
            <p className="text-sm font-semibold leading-snug text-text-primary">{title}</p>
            <p className="mt-1.5 text-sm text-text-secondary">{body}</p>
          </>
        ) : (
          <p className="text-sm text-text-secondary">
            Add a few transactions and we'll surface useful patterns here.
          </p>
        )}
        <Link
          to="/insights"
          className="mt-auto pt-4 text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
        >
          View all insights →
        </Link>
      </CardContent>
    </Card>
  );
}
