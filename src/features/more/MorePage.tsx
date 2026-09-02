import { ChevronRight, HelpCircle, LogOut, Settings, Tags } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

const LINKS = [
  { label: "Categories", to: "/categories", icon: Tags },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Help & Support", to: "mailto:support@mywallet.app", icon: HelpCircle },
];

export default function MorePage() {
  const { signOut } = useAuth();

  return (
    <div className="lg:hidden">
      <PageHeader title="More" />
      <Card className="divide-y divide-border overflow-hidden">
        {LINKS.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-text-primary transition-colors hover:bg-background"
          >
            <link.icon className="size-4.5 text-text-secondary" aria-hidden="true" />
            <span className="flex-1">{link.label}</span>
            <ChevronRight className="size-4 text-text-tertiary" aria-hidden="true" />
          </Link>
        ))}
        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-expense-600 transition-colors hover:bg-background"
        >
          <LogOut className="size-4.5" aria-hidden="true" />
          Logout
        </button>
      </Card>
    </div>
  );
}
