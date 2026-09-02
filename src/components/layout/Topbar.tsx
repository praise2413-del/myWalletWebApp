import { Bell, Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

interface TopbarProps {
  onOpenMobileNav: () => void;
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur supports-backdrop-filter:bg-surface/80 lg:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-background lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search anything..."
          aria-label="Search"
          className="h-9 w-full rounded-lg border border-transparent bg-background pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:bg-surface focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Notifications"
          className="flex size-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
        >
          <Bell className="size-[18px]" aria-hidden="true" />
        </button>
        <ThemeToggle />
        <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <UserMenu />
      </div>
    </header>
  );
}
