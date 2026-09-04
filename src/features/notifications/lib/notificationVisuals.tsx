import { Lightbulb, ShieldCheck, TrendingUp, type LucideIcon } from "lucide-react";
import type { NotificationType } from "@/types";

export type NotificationCategory = "reports" | "security" | "insights";

/** Which real `NotificationType`s belong to each filter-tab category — extend as new types are added. */
export const CATEGORY_TYPES: Record<NotificationCategory, NotificationType[]> = {
  reports: ["WEEKLY_REPORT"],
  security: ["PASSWORD_RESET"],
  insights: [],
};

interface NotificationVisual {
  icon: LucideIcon;
  /** Icon square background/foreground. */
  iconBgClassName: string;
  iconColorClassName: string;
  /** Small unread-status dot color. */
  dotClassName: string;
}

const VISUALS: Record<NotificationType, NotificationVisual> = {
  WEEKLY_REPORT: {
    icon: TrendingUp,
    iconBgClassName: "bg-primary-50 dark:bg-primary-950/60",
    iconColorClassName: "text-primary-600 dark:text-primary-500",
    dotClassName: "bg-primary-500",
  },
  PASSWORD_RESET: {
    // Security events get a fixed dark square regardless of theme — a
    // deliberate, more serious accent distinct from the brand green.
    icon: ShieldCheck,
    iconBgClassName: "bg-slate-900",
    iconColorClassName: "text-white",
    dotClassName: "bg-expense-500",
  },
};

const FALLBACK_VISUAL: NotificationVisual = {
  icon: Lightbulb,
  iconBgClassName: "bg-warning-50 dark:bg-warning-500/10",
  iconColorClassName: "text-warning-600 dark:text-warning-500",
  dotClassName: "bg-warning-500",
};

export function getNotificationVisual(type: NotificationType): NotificationVisual {
  return VISUALS[type] ?? FALLBACK_VISUAL;
}
