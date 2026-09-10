import {
  BarChart3,
  BookText,
  LayoutDashboard,
  Lightbulb,
  Settings,
  Tags,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
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

// Business Finance is a much smaller nav for now (Phase 1 — foundation
// only). Grows alongside the roadmap in supabase/migrations and
// src/features/business as later phases land.
export const BUSINESS_NAV_ITEMS: NavItem[] = [
  { label: "Business Dashboard", path: "/business", icon: LayoutDashboard },
  { label: "Chart of Accounts", path: "/business/accounts", icon: BookText },
  { label: "Settings", path: "/settings", icon: Settings },
];

export const BUSINESS_MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/business", icon: LayoutDashboard },
  { label: "Accounts", path: "/business/accounts", icon: BookText },
];
