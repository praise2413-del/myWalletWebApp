import {
  BarChart3,
  BookOpen,
  BookText,
  FileBarChart,
  FileText,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  Package,
  Receipt,
  Settings,
  Tags,
  Target,
  TrendingUp,
  Truck,
  UsersRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Optional section heading rendered above this item when it differs from the previous item's section (desktop sidebar only). */
  section?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Transactions", path: "/transactions", icon: Wallet },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Insights", path: "/insights", icon: Lightbulb },
  { label: "Categories", path: "/categories", icon: Tags },
  { label: "Settings", path: "/settings", icon: Settings },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/", icon: LayoutDashboard },
  { label: "Transactions", path: "/transactions", icon: Wallet },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Insights", path: "/insights", icon: Lightbulb },
];

// Business Finance nav grows alongside the roadmap in supabase/migrations
// and src/features/business as later phases land. Grouped into sections
// (Sidebar renders a heading whenever `section` changes) since a flat
// list stopped being scannable once Phase 4 (Operations) added five more
// pages on top of Phase 1-3's foundation/accounting/statements pages.
export const BUSINESS_NAV_ITEMS: NavItem[] = [
  { label: "Business Dashboard", path: "/business", icon: LayoutDashboard },
  { label: "Sales", path: "/business/sales", icon: FileText, section: "Operations" },
  { label: "Purchases", path: "/business/purchases", icon: Receipt, section: "Operations" },
  { label: "Customers", path: "/business/customers", icon: Users, section: "Operations" },
  { label: "Suppliers", path: "/business/suppliers", icon: Truck, section: "Operations" },
  { label: "Products", path: "/business/products", icon: Package, section: "Operations" },
  { label: "Journal Entries", path: "/business/journal", icon: BookOpen, section: "Accounting" },
  { label: "Chart of Accounts", path: "/business/accounts", icon: BookText, section: "Accounting" },
  { label: "General Ledger", path: "/business/ledger", icon: BarChart3, section: "Accounting" },
  { label: "Financial Statements", path: "/business/statements", icon: FileBarChart, section: "Accounting" },
  { label: "Business Insights", path: "/business/insights", icon: LineChart, section: "Intelligence" },
  { label: "Planning", path: "/business/planning", icon: Target, section: "Intelligence" },
  { label: "Forecast & Guidance", path: "/business/forecast", icon: TrendingUp, section: "Intelligence" },
  { label: "Team", path: "/business/team", icon: UsersRound, section: "" },
  { label: "Settings", path: "/settings", icon: Settings, section: "" },
];

// The mobile bottom bar stays capped at 4 icons + More (same convention
// as personal) — the highest-frequency operational pages live here;
// everything else is reachable from the business-aware More page.
export const BUSINESS_MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/business", icon: LayoutDashboard },
  { label: "Sales", path: "/business/sales", icon: FileText },
  { label: "Purchases", path: "/business/purchases", icon: Receipt },
  { label: "Journal", path: "/business/journal", icon: BookOpen },
];
