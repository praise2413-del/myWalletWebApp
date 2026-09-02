import { zodResolver } from "@hookform/resolvers/zod";
import { Database, Monitor, Moon, Shield, Sun, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/hooks/useAuth";
import { type ThemeMode, useThemeStore } from "@/hooks/useThemeStore";
import { useToastStore } from "@/hooks/useToastStore";
import { DeleteAccountDialog } from "@/features/settings/components/DeleteAccountDialog";
import { supabase } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/utils/authErrors";
import { cn } from "@/lib/utils/cn";
import { exportUserDataAsCsv } from "@/lib/utils/exportData";
import { type ChangePasswordInput, changePasswordSchema } from "@/lib/validations/auth";

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

const profileSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
});
type ProfileFormInput = z.infer<typeof profileSchema>;

function ProfileTab() {
  const { profile, user, refreshProfile } = useAuth();
  const showToast = useToastStore((state) => state.showToast);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    values: { fullName: profile?.fullName ?? "" },
  });

  const onSubmit = async ({ fullName }: ProfileFormInput) => {
    if (!profile) return;
    setFormError(null);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
    if (error) {
      setFormError("We couldn't save your profile. Please try again.");
      return;
    }
    await refreshProfile();
    reset({ fullName });
    showToast("Profile updated");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-4">
      <h2 className="text-sm font-semibold text-text-primary">Profile information</h2>
      {formError && <AlertBanner message={formError} />}
      <TextField label="Full name" error={errors.fullName?.message} {...register("fullName")} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-text-secondary">Email address</span>
        <input
          value={user?.email ?? ""}
          readOnly
          className="h-10 w-full rounded-lg border border-border-strong bg-background px-3 text-sm text-text-tertiary focus:outline-none"
        />
      </label>
      <Button type="submit" size="sm" disabled={!isDirty || isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}

function PreferencesTab() {
  const { profile, refreshProfile } = useAuth();
  const showToast = useToastStore((state) => state.showToast);
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const currency = profile?.currency ?? "TZS";
  const [saving, setSaving] = useState(false);
  const [targetInput, setTargetInput] = useState(String(profile?.allocationTarget ?? 30));
  const [targetError, setTargetError] = useState<string | null>(null);

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: "light", label: "Light", icon: Sun },
    { mode: "dark", label: "Dark", icon: Moon },
    { mode: "system", label: "System", icon: Monitor },
  ];

  const handleCurrencyChange = async (value: string) => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ currency: value }).eq("id", profile.id);
    setSaving(false);
    if (!error) {
      await refreshProfile();
      showToast("Currency updated");
    }
  };

  const handleTargetSave = async () => {
    if (!profile) return;
    const value = Number(targetInput);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setTargetError("Enter a percentage between 0 and 100");
      setTargetInput(String(profile.allocationTarget));
      return;
    }
    setTargetError(null);
    if (value === profile.allocationTarget) return;

    setSaving(true);
    const { error } = await supabase.from("profiles").update({ allocation_target: value }).eq("id", profile.id);
    setSaving(false);
    if (!error) {
      await refreshProfile();
      showToast("Savings & investment target updated");
    }
  };

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
          value={currency}
          disabled={saving}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-border-strong bg-background px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
        >
          <option value="TZS">TZS — Tanzanian Shilling</option>
          <option value="USD">USD — US Dollar</option>
          <option value="KES">KES — Kenyan Shilling</option>
        </select>
      </label>

      <div className="max-w-xs">
        <h2 className="mb-1 text-sm font-semibold text-text-primary">Savings & Investment Target</h2>
        <p className="mb-3 text-xs text-text-tertiary">
          The percentage of your income you're aiming to set aside as savings or investments each period.
          Insights and reports compare your actual allocation against this target.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-text-secondary">Target percentage</span>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={targetInput}
              disabled={saving}
              onChange={(e) => setTargetInput(e.target.value)}
              onBlur={handleTargetSave}
              className={cn(
                "h-10 w-full rounded-lg border bg-background pl-3 pr-8 text-sm text-text-primary focus:outline-none",
                targetError ? "border-expense-500" : "border-border-strong focus:border-primary-500",
              )}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
              %
            </span>
          </div>
          {targetError && <p className="mt-1.5 text-xs text-expense-600">{targetError}</p>}
        </label>
      </div>
    </div>
  );
}

function SecurityTab() {
  const showToast = useToastStore((state) => state.showToast);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async ({ newPassword }: ChangePasswordInput) => {
    setFormError(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }
    reset();
    showToast("Password updated");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-4">
      <h2 className="text-sm font-semibold text-text-primary">Change password</h2>
      {formError && <AlertBanner message={formError} />}
      <PasswordField
        label="New password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <PasswordField
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
}

function DataTab() {
  const { user, signOut } = useAuth();
  const showToast = useToastStore((state) => state.showToast);
  const [exporting, setExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    const result = await exportUserDataAsCsv(user.id);
    setExporting(false);
    if (result.error) {
      showToast(result.error, "error");
      return;
    }
    showToast("Export downloaded");
  };

  const handleDeleteAccount = async () => {
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      return { error: "We couldn't delete your account. Please try again." };
    }
    await signOut();
  };

  return (
    <div className="max-w-md space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">Export your data</h2>
        <p className="mt-1 text-xs text-text-tertiary">
          Download all your transactions and savings/investment allocations as a CSV file.
        </p>
        <Button size="sm" variant="outline" className="mt-3" onClick={handleExport} disabled={exporting}>
          {exporting ? "Preparing..." : "Export Data"}
        </Button>
      </div>
      <div className="border-t border-border pt-4">
        <h2 className="text-sm font-semibold text-expense-600">Delete account</h2>
        <p className="mt-1 text-xs text-text-tertiary">
          Permanently delete your account and all associated financial data.
        </p>
        <Button size="sm" variant="danger" className="mt-3" onClick={() => setDeleteDialogOpen(true)}>
          Delete Account
        </Button>
      </div>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
