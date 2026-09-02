import {
  Baby,
  Banknote,
  Bike,
  Book,
  Briefcase,
  Bus,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  type LucideIcon,
  Music,
  Phone,
  PiggyBank,
  Plane,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Zap,
} from "lucide-react";

/**
 * Keyed by the icon slug stored in categories.icon (kebab-case), not by
 * category name — a custom category's chosen icon must render correctly
 * regardless of what the user named it.
 */
const ICONS_BY_SLUG: Record<string, LucideIcon> = {
  "utensils-crossed": UtensilsCrossed,
  bus: Bus,
  home: Home,
  zap: Zap,
  "graduation-cap": GraduationCap,
  heart: Heart,
  "shopping-bag": ShoppingBag,
  clapperboard: Clapperboard,
  phone: Phone,
  baby: Baby,
  sparkles: Sparkles,
  receipt: Receipt,
  wallet: Wallet,
  briefcase: Briefcase,
  banknote: Banknote,
  gift: Gift,
  "trending-up": TrendingUp,
  "piggy-bank": PiggyBank,
  car: Car,
  bike: Bike,
  plane: Plane,
  coffee: Coffee,
  "shopping-cart": ShoppingCart,
  book: Book,
  music: Music,
  dumbbell: Dumbbell,
  stethoscope: Stethoscope,
  laptop: Laptop,
};

/** The curated set offered in the category icon picker. */
export const ICON_PICKER_OPTIONS: { slug: string; icon: LucideIcon }[] = Object.entries(ICONS_BY_SLUG).map(
  ([slug, icon]) => ({ slug, icon }),
);

export const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

export function getCategoryIcon(slug: string): LucideIcon {
  return ICONS_BY_SLUG[slug] ?? Wallet;
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
