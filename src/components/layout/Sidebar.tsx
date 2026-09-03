import { LifeBuoy, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Logo } from "@/components/layout/Logo";
import { NAV_ITEMS } from "@/components/layout/navItems";
import { cn } from "@/lib/utils/cn";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-600 text-white shadow-sm dark:border-primary-500/30 dark:bg-primary-500/15 dark:text-primary-400 dark:shadow-none"
                  : "text-text-secondary hover:bg-background hover:text-text-primary",
              )
            }
          >
            <item.icon className="size-[18px] shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-border p-4">
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          Quick actions
        </p>
        <div className="space-y-2">
          <NavLink
            to="/transactions?new=income"
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add Income
          </NavLink>
          <NavLink
            to="/transactions?new=expense"
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border-strong text-sm font-medium text-text-primary transition-colors hover:bg-background dark:border-transparent dark:bg-expense-500/10 dark:text-expense-500 dark:hover:bg-expense-500/15"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add Expense
          </NavLink>
        </div>
        <a
          href="mailto:praise2413@gmail.com"
          className="flex items-center gap-2 rounded-lg px-1 py-2 text-xs font-medium text-text-tertiary transition-colors hover:text-text-secondary"
        >
          <LifeBuoy className="size-4" aria-hidden="true" />
          Need help? Contact support
        </a>
      </div>
    </aside>
  );
}
