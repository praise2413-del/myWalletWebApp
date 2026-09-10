import { BookText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAccountBalances } from "@/features/business/hooks/useAccountBalances";
import { useChartOfAccounts } from "@/features/business/hooks/useChartOfAccounts";
import { useBusiness } from "@/hooks/useBusiness";
import { formatCurrency } from "@/lib/utils/currency";
import type { AccountType, BusinessAccount } from "@/types";

const GROUPS: { type: AccountType; label: string }[] = [
  { type: "ASSET", label: "Assets" },
  { type: "LIABILITY", label: "Liabilities" },
  { type: "EQUITY", label: "Equity" },
  { type: "REVENUE", label: "Revenue" },
  { type: "EXPENSE", label: "Expenses" },
];

function AccountRow({ account, balance, currency }: { account: BusinessAccount; balance: number; currency: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{account.name}</p>
        {account.subtype && <p className="text-xs text-text-tertiary">{account.subtype}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-mono text-xs text-text-tertiary">{account.code}</span>
        {account.isDefault && <Badge>Default</Badge>}
        <span className="w-28 text-right text-sm font-medium text-text-primary">{formatCurrency(balance, currency)}</span>
      </div>
    </div>
  );
}

export default function ChartOfAccountsPage() {
  const { activeBusiness } = useBusiness();
  const currency = activeBusiness?.currency ?? "TZS";
  const { accounts, loading, error } = useChartOfAccounts();
  const { balances } = useAccountBalances();
  const balanceByAccountId = new Map(balances.map((b) => [b.accountId, b.balance]));

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        description={
          activeBusiness
            ? `The full list of accounts used to record ${activeBusiness.name}'s transactions.`
            : undefined
        }
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error ? (
        <EmptyState icon={BookText} title="Couldn't load accounts" description={error} />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={BookText}
          title="No accounts yet"
          description="A starter chart of accounts is created automatically when your business is set up."
        />
      ) : (
        <div className="space-y-6">
          {GROUPS.map((group) => {
            const groupAccounts = accounts.filter((a) => a.type === group.type);
            if (groupAccounts.length === 0) return null;
            return (
              <Card key={group.type}>
                <CardHeader>
                  <CardTitle>{group.label.toUpperCase()}</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border p-0">
                  {groupAccounts.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      balance={balanceByAccountId.get(account.id) ?? 0}
                      currency={currency}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
