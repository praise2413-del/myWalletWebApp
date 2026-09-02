import {
  BarChart3,
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
