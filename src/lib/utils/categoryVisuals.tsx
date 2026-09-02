import {
  Baby,
  Banknote,
  Briefcase,
  Bus,
  Clapperboard,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Phone,
  PiggyBank,
  Receipt,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS_BY_NAME: Record<string, LucideIcon> = {
  Food: UtensilsCrossed,
  Transport: Bus,
  Rent: Home,
  Utilities: Zap,
  Education: GraduationCap,
  Health: Heart,
  Shopping: ShoppingBag,
  Entertainment: Clapperboard,
  Communication: Phone,
  Family: Baby,
  "Personal Care": Sparkles,
  Bills: Receipt,
  Salary: Wallet,
  Business: Briefcase,
  Freelance: Briefcase,
  Allowance: Banknote,
  Gift: Gift,
  Investment: TrendingUp,
  Savings: PiggyBank,
  Other: Wallet,
};

export const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

export function getCategoryIcon(name: string): LucideIcon {
  return ICONS_BY_NAME[name] ?? Wallet;
}

export function getCategoryColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return CHART_COLORS[hash % CHART_COLORS.length];
}

/** Assigns colors by position so categories plotted together in one chart never collide. */
export function getChartSeriesColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
