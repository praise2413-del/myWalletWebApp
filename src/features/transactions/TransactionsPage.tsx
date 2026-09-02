import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";

export default function TransactionsPage() {
  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Manage your income and expenses"
        actions={
          <Button>
            <Plus className="size-4" aria-hidden="true" />
            Add Transaction
          </Button>
        }
      />
      <EmptyState
        icon={Wallet}
        title="No transactions yet"
        description="Add your first income or expense to start understanding your finances."
        action={
          <Button size="sm" className="mt-1">
            <Plus className="size-4" aria-hidden="true" />
            Add Transaction
          </Button>
        }
      />
    </div>
  );
}
