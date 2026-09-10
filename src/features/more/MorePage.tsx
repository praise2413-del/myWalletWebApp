import {
  BarChart3,
  BookText,
  ChevronRight,
  FileBarChart,
  HelpCircle,
  LineChart,
  LogOut,
  Package,
  Settings,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

const PERSONAL_LINKS = [
  { label: "Categories", to: "/categories", icon: Tags },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Help & Support", to: "mailto:praise2413@gmail.com", icon: HelpCircle },
];

// The business mobile bottom bar only shows the 4 highest-frequency pages
// (Dashboard/Sales/Purchases/Journal) — everything else Business Finance
// offers lives here instead of crowding the bottom bar further.
const BUSINESS_LINKS = [
  { label: "Customers", to: "/business/customers", icon: Users },
  { label: "Suppliers", to: "/business/suppliers", icon: Truck },
  { label: "Products", to: "/business/products", icon: Package },
  { label: "Chart of Accounts", to: "/business/accounts", icon: BookText },
  { label: "General Ledger", to: "/business/ledger", icon: BarChart3 },
  { label: "Financial Statements", to: "/business/statements", icon: FileBarChart },
  { label: "Business Insights", to: "/business/insights", icon: LineChart },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Help & Support", to: "mailto:praise2413@gmail.com", icon: HelpCircle },
];

export default function MorePage() {
  const { signOut } = useAuth();
  const isBusiness = useLocation().pathname.startsWith("/business");
  const links = isBusiness ? BUSINESS_LINKS : PERSONAL_LINKS;

  return (
    <div className="lg:hidden">
      <PageHeader title="More" />
      <Card className="divide-y divide-border overflow-hidden">
        {links.map((link) => (
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
