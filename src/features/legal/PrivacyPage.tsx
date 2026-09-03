import { LegalLayout, LegalSection } from "@/features/legal/components/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="September 2, 2026">
      <p className="rounded-lg border border-border bg-surface p-4 text-xs text-text-tertiary">
        myWallet is under active development. This is a working draft of our privacy policy, written in plain
        language — it has not yet been reviewed by a lawyer and will be finalized before general release.
      </p>

      <LegalSection title="1. What we collect">
        <p>
          <strong>Account information:</strong> your name and email address, and your password (handled entirely by
          our authentication provider, Supabase Auth — we never see or store your password in plain text).
        </p>
        <p>
          <strong>Financial data you enter:</strong> transactions, categories, savings/investment allocations, and
          your preferred currency and savings target. This is the data myWallet exists to help you understand — we
          only store what you explicitly add.
        </p>
        <p>
          <strong>Preferences:</strong> your theme choice (light/dark/system) is stored in your browser only, not
          on our servers.
        </p>
      </LegalSection>

      <LegalSection title="2. How we use it">
        <p>
          Solely to run myWallet for you: to show your dashboard, reports, and insights, and to keep your session
          signed in. We do not use your financial data for advertising, and we do not sell it.
        </p>
      </LegalSection>

      <LegalSection title="3. How it's stored and protected">
        <p>
          Your data is stored in a PostgreSQL database hosted by Supabase, protected by Row Level Security policies
          enforced at the database level — meaning the database itself refuses to return your data to anyone but
          you, regardless of what the application requests. Connections to myWallet are encrypted in transit.
        </p>
      </LegalSection>

      <LegalSection title="4. Who we share it with">
        <p>
          We don't sell or share your financial data with third parties. Supabase, Inc. is our infrastructure
          provider (hosting, authentication, and database) and processes data on our behalf to operate the service.
        </p>
      </LegalSection>

      <LegalSection title="5. Your rights">
        <p>
          You can view, edit, and delete your transactions, categories, and allocations at any time from within
          myWallet. Data export and full account deletion are planned for Settings → Data & Privacy. Until then,
          contact us to request either.
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies and local storage">
        <p>
          myWallet uses your browser's local storage to keep you signed in and to remember your theme preference.
          We don't use third-party tracking or advertising cookies.
        </p>
      </LegalSection>

      <LegalSection title="7. Children's privacy">
        <p>myWallet isn't directed at children and isn't intended for use by anyone under 18.</p>
      </LegalSection>

      <LegalSection title="8. Changes to this policy">
        <p>We may update this policy as myWallet develops. We'll change the "Last updated" date above when we do.</p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>Questions about this policy, or a data request? Reach us at praise2413@gmail.com.</p>
      </LegalSection>
    </LegalLayout>
  );
}
