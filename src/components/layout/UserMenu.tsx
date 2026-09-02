import { LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function UserMenu() {
  const { profile, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const displayName = profile?.fullName?.trim() || user?.email?.split("@")[0] || "Account";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-background"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:text-primary-500">
          {initial}
        </span>
        <span className="hidden max-w-24 truncate text-sm font-medium text-text-primary sm:block">
          {displayName}
        </span>
        <ChevronDown className="hidden size-4 text-text-tertiary sm:block" aria-hidden="true" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-[var(--shadow-popover)]"
          >
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-sm font-medium text-text-primary">{displayName}</p>
              <p className="truncate text-xs text-text-tertiary">{user?.email}</p>
            </div>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
            >
              <User className="size-4" aria-hidden="true" />
              Profile
            </Link>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
            >
              <Settings className="size-4" aria-hidden="true" />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-expense-600 transition-colors hover:bg-background"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
