import { FileDown } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { BalanceSheetView } from "@/features/business/components/statements/BalanceSheetView";
import { CashFlowStatementView } from "@/features/business/components/statements/CashFlowStatementView";
import { IncomeStatementView } from "@/features/business/components/statements/IncomeStatementView";
import { TrialBalanceView } from "@/features/business/components/statements/TrialBalanceView";
import { BusinessReportPreviewOverlay } from "@/features/business/components/reports/BusinessReportPreviewOverlay";
import { useBusinessLedgerLines } from "@/features/business/hooks/useBusinessLedgerLines";
import {
  buildBalanceSheet,
  buildCashFlowStatement,
  buildIncomeStatement,
  buildTrialBalance,
} from "@/features/business/lib/statements";
import { useBusiness } from "@/hooks/useBusiness";
import { getPeriodRange, toDateKey, todayDateKey } from "@/lib/utils/period";
import { cn } from "@/lib/utils/cn";

type StatementTab = "TRIAL_BALANCE" | "INCOME_STATEMENT" | "BALANCE_SHEET" | "CASH_FLOW";

const TABS: { id: StatementTab; label: string }[] = [
  { id: "TRIAL_BALANCE", label: "Trial Balance" },
  { id: "INCOME_STATEMENT", label: "Income Statement" },
  { id: "BALANCE_SHEET", label: "Balance Sheet" },
  { id: "CASH_FLOW", label: "Cash Flow" },
];

const today = todayDateKey;

export default function BusinessStatementsPage() {
  const { activeBusiness } = useBusiness();
  const currency = activeBusiness?.currency ?? "TZS";
  const { lines, loading, error } = useBusinessLedgerLines();

  const [tab, setTab] = useState<StatementTab>("INCOME_STATEMENT");
  const [asOfDate, setAsOfDate] = useState(today());
  const [reportOpen, setReportOpen] = useState(false);

  const thisMonth = useMemo(() => getPeriodRange("This Month"), []);
  const [dateFrom, setDateFrom] = useState(toDateKey(thisMonth.start));
  const [dateTo, setDateTo] = useState(toDateKey(thisMonth.end));

  const usesRange = tab === "INCOME_STATEMENT" || tab === "CASH_FLOW";

  const trialBalance = useMemo(() => buildTrialBalance(lines, asOfDate), [lines, asOfDate]);
  const incomeStatement = useMemo(() => buildIncomeStatement(lines, dateFrom, dateTo), [lines, dateFrom, dateTo]);
  const balanceSheet = useMemo(() => buildBalanceSheet(lines, asOfDate), [lines, asOfDate]);
  const cashFlow = useMemo(() => buildCashFlowStatement(lines, dateFrom, dateTo), [lines, dateFrom, dateTo]);

  return (
    <div>
      <PageHeader
        title="Financial Statements"
        description="Trial Balance, Income Statement, Balance Sheet, and Cash Flow — always derived live from your journal."
        actions={
          !loading &&
          activeBusiness && (
            <Button variant="outline" onClick={() => setReportOpen(true)}>
              <FileDown className="size-4" aria-hidden="true" />
              Generate Report
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
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

        {usesRange ? (
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="stmt-date-from">From date</label>
            <input
              id="stmt-date-from"
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
            />
            <span className="text-text-tertiary">–</span>
            <label className="sr-only" htmlFor="stmt-date-to">To date</label>
            <input
              id="stmt-date-to"
              type="date"
              value={dateTo}
              min={dateFrom}
              max={today()}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-tertiary" htmlFor="stmt-as-of">As of</label>
            <input
              id="stmt-as-of"
              type="date"
              value={asOfDate}
              max={today()}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {error ? (
        <AlertBanner message={error} />
      ) : loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          {tab === "TRIAL_BALANCE" && <TrialBalanceView trialBalance={trialBalance} currency={currency} />}
          {tab === "INCOME_STATEMENT" && <IncomeStatementView statement={incomeStatement} currency={currency} />}
          {tab === "BALANCE_SHEET" && <BalanceSheetView balanceSheet={balanceSheet} currency={currency} />}
          {tab === "CASH_FLOW" && <CashFlowStatementView statement={cashFlow} currency={currency} />}
        </>
      )}

      {reportOpen && activeBusiness && (
        <BusinessReportPreviewOverlay
          onClose={() => setReportOpen(false)}
          business={activeBusiness}
          lines={lines}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}
    </div>
  );
}
