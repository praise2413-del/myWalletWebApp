import { BookText } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useChartOfAccounts } from "@/features/business/hooks/useChartOfAccounts";
import { useLedgerQuery } from "@/features/business/hooks/useLedgerQuery";
import { useBusiness } from "@/hooks/useBusiness";
import { formatCurrency } from "@/lib/utils/currency";
import type { AccountType } from "@/types";

const GROUPS: { type: AccountType; label: string }[] = [
  { type: "ASSET", label: "Assets" },
  { type: "LIABILITY", label: "Liabilities" },
  { type: "EQUITY", label: "Equity" },
  { type: "REVENUE", label: "Revenue" },
  { type: "EXPENSE", label: "Expenses" },
];

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function GeneralLedgerPage() {
  const { activeBusiness } = useBusiness();
  const currency = activeBusiness?.currency ?? "TZS";
  const { accounts, loading: accountsLoading } = useChartOfAccounts();

  const [accountId, setAccountId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const selectedAccount = useMemo(() => accounts.find((a) => a.id === accountId) ?? null, [accounts, accountId]);
  const ledger = useLedgerQuery(accountId || null, selectedAccount?.type ?? null, dateFrom, dateTo);

  const closingBalance = ledger.rows.length > 0 ? ledger.rows[ledger.rows.length - 1].runningBalance : ledger.openingBalance;

  return (
    <div>
      <PageHeader title="General Ledger" description="Every posted line for a single account, with a running balance." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          aria-label="Account"
          className="h-9 flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none sm:max-w-sm"
        >
          <option value="">Select an account</option>
          {GROUPS.map((group) => {
            const groupAccounts = accounts.filter((a) => a.type === group.type);
            if (groupAccounts.length === 0) return null;
            return (
              <optgroup key={group.type} label={group.label}>
                {groupAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} · {account.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="ledger-date-from">From date</label>
          <input
            id="ledger-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
          />
          <span className="text-text-tertiary">–</span>
          <label className="sr-only" htmlFor="ledger-date-to">To date</label>
          <input
            id="ledger-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>

      {accountsLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !selectedAccount ? (
        <EmptyState icon={BookText} title="Select an account" description="Choose an account above to see its ledger." />
      ) : ledger.error ? (
        <AlertBanner message={ledger.error} />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>
              {selectedAccount.code} · {selectedAccount.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ledger.loading ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-5 py-3">Reference</th>
                      <th className="px-5 py-3 text-right">Debit</th>
                      <th className="px-5 py-3 text-right">Credit</th>
                      <th className="px-5 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dateFrom && (
                      <tr className="border-b border-border bg-background/60">
                        <td className="px-5 py-2.5 text-text-tertiary" colSpan={5}>
                          Opening balance
                        </td>
                        <td className="px-5 py-2.5 text-right font-medium text-text-primary">
                          {formatCurrency(ledger.openingBalance, currency)}
                        </td>
                      </tr>
                    )}
                    {ledger.rows.map((row) => (
                      <tr key={row.lineId} className="border-b border-border last:border-0 hover:bg-background/60">
                        <td className="whitespace-nowrap px-5 py-3 text-text-secondary">{formatDate(row.entryDate)}</td>
                        <td className="px-5 py-3 text-text-primary">{row.description}</td>
                        <td className="px-5 py-3 text-text-tertiary">{row.reference || "—"}</td>
                        <td className="px-5 py-3 text-right text-text-primary">
                          {row.debit > 0 ? formatCurrency(row.debit, currency) : "—"}
                        </td>
                        <td className="px-5 py-3 text-right text-text-primary">
                          {row.credit > 0 ? formatCurrency(row.credit, currency) : "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-text-primary">
                          {formatCurrency(row.runningBalance, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-background font-semibold text-text-primary">
                      <td className="px-5 py-3" colSpan={5}>
                        Closing balance
                      </td>
                      <td className="px-5 py-3 text-right">{formatCurrency(closingBalance, currency)}</td>
                    </tr>
                  </tfoot>
                </table>
                {ledger.rows.length === 0 && (
                  <p className="px-5 py-6 text-center text-sm text-text-tertiary">No activity in this account yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
