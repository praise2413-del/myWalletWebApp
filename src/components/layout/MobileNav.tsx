import { MoreHorizontal, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { MOBILE_NAV_ITEMS } from "@/components/layout/navItems";
import { cn } from "@/lib/utils/cn";

export function MobileNav() {
  const [first, second, third, fourth] = MOBILE_NAV_ITEMS;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Mobile navigation"
    >
      {[first, second].map((item) => (
        <MobileNavLink key={item.path} item={item} />
      ))}

      <NavLink
        to="/transactions?new=expense"
        aria-label="Add transaction"
        className="flex size-11 shrink-0 -translate-y-3 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30"
      >
        <Plus className="size-5" aria-hidden="true" />
      </NavLink>

      {[third, fourth].map((item) => (
        <MobileNavLink key={item.path} item={item} />
      ))}

      <NavLink
        to="/more"
        className={({ isActive }) =>
          cn(
            "flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium",
            isActive ? "text-primary-600 dark:text-primary-500" : "text-text-tertiary",
          )
        }
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
        More
      </NavLink>
    </nav>
  );
}

function MobileNavLink({ item }: { item: (typeof MOBILE_NAV_ITEMS)[number] }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      className={({ isActive }) =>
        cn(
          "flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium",
          isActive ? "text-primary-600 dark:text-primary-500" : "text-text-tertiary",
        )
      }
    >
      <item.icon className="size-5" aria-hidden="true" />
      {item.label}
    </NavLink>
  );
}
