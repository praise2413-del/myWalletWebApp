import { Database, Monitor, Moon, Shield, Sun, User } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { type ThemeMode, useThemeStore } from "@/hooks/useThemeStore";
import { MOCK_CURRENT_USER } from "@/lib/mock/currentUser";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Sun },
  { id: "security", label: "Security", icon: Shield },
  { id: "data", label: "Data & Privacy", icon: Database },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account and preferences" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Settings sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-primary-50 text-primary-700 dark:text-primary-500"
                  : "text-text-secondary hover:bg-background hover:text-text-primary",
              )}
            >
              <t.icon className="size-4" aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </nav>

        <Card className="p-6">
          {tab === "profile" && <ProfileTab />}
          {tab === "preferences" && <PreferencesTab />}
          {tab === "security" && <SecurityTab />}
          {tab === "data" && <DataTab />}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text-secondary">{label}</span>
      <input
        defaultValue={value}
        readOnly
        className="h-10 w-full rounded-lg border border-border-strong bg-background px-3 text-sm text-text-primary focus:outline-none"
      />
    </label>
  );
}

function ProfileTab() {
  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-sm font-semibold text-text-primary">Profile information</h2>
      <Field label="Full name" value={MOCK_CURRENT_USER.fullName} />
      <Field label="Email address" value={MOCK_CURRENT_USER.email} />
      <p className="text-xs text-text-tertiary">
        Profile editing will be enabled once authentication is connected.
      </p>
      <Button size="sm" disabled>
        Save Changes
      </Button>
    </div>
  );
}

function PreferencesTab() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: "light", label: "Light", icon: Sun },
    { mode: "dark", label: "Dark", icon: Moon },
    { mode: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="mb-1 text-sm font-semibold text-text-primary">Appearance</h2>
        <p className="mb-3 text-xs text-text-tertiary">Choose how myWallet looks on this device.</p>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.mode}
              type="button"
              onClick={() => setMode(option.mode)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border px-3 py-3 text-xs font-medium transition-colors",
                mode === option.mode
                  ? "border-primary-500 bg-primary-50 text-primary-700 dark:text-primary-500"
                  : "border-border-strong text-text-secondary hover:bg-background",
              )}
            >
              <option.icon className="size-4" aria-hidden="true" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block max-w-xs">
        <span className="mb-1.5 block text-sm font-medium text-text-secondary">Currency</span>
        <select
          defaultValue={MOCK_CURRENT_USER.currency}
          className="h-10 w-full rounded-lg border border-border-strong bg-background px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
        >
          <option value="TZS">TZS — Tanzanian Shilling</option>
          <option value="USD">USD — US Dollar</option>
          <option value="KES">KES — Kenyan Shilling</option>
        </select>
      </label>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-sm font-semibold text-text-primary">Change password</h2>
      <Field label="Current password" value="" />
      <Field label="New password" value="" />
      <p className="text-xs text-text-tertiary">
        Password management will be enabled once Supabase Auth is connected.
      </p>
      <Button size="sm" disabled>
        Update Password
      </Button>
    </div>
  );
}

function DataTab() {
  return (
    <div className="max-w-md space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">Export your data</h2>
        <p className="mt-1 text-xs text-text-tertiary">Download your transactions as a CSV file.</p>
        <Button size="sm" variant="outline" className="mt-3" disabled>
          Export Data
        </Button>
      </div>
      <div className="border-t border-border pt-4">
        <h2 className="text-sm font-semibold text-expense-600">Delete account</h2>
        <p className="mt-1 text-xs text-text-tertiary">
          Permanently delete your account and all associated financial data.
        </p>
        <Button size="sm" variant="danger" className="mt-3" disabled>
          Delete Account
        </Button>
      </div>
    </div>
  );
}
