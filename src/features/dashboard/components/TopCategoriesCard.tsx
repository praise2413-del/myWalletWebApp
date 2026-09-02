import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, safeDivide } from "@/lib/utils/currency";

interface TopCategoriesCardProps {
  data: { name: string; amount: number }[];
  currency: string;
}

export function TopCategoriesCard({ data, currency }: TopCategoriesCardProps) {
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const max = sorted[0]?.amount ?? 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Top Categories</CardTitle>
          <CardDescription>By amount spent</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3.5">
          {sorted.map((item) => (
            <li key={item.name}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-text-primary">{item.name}</span>
                <span className="text-text-secondary">{formatCurrency(item.amount, currency)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary-500"
                  style={{ width: `${safeDivide(item.amount, max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
