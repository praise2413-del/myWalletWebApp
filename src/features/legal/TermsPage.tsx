import { Link } from "react-router-dom";
import { LegalLayout, LegalSection } from "@/features/legal/components/LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="September 2, 2026">
      <p className="rounded-lg border border-border bg-surface p-4 text-xs text-text-tertiary">
        myWallet is under active development. This is a working draft of our terms, written in plain language so
        you know what you're agreeing to — it has not yet been reviewed by a lawyer and will be finalized before
        general release.
      </p>

      <LegalSection title="1. Acceptance of these terms">
        <p>
          By creating a myWallet account, you agree to these Terms of Service. If you don't agree, please don't use
          myWallet.
        </p>
      </LegalSection>

      <LegalSection title="2. What myWallet is">
        <p>
          myWallet is a personal finance tracking tool. You record income, expenses, and savings/investment
          allocations, and myWallet organizes that information into dashboards, reports, and rule-based insights to
          help you understand your own recorded financial activity.
        </p>
        <p>
          myWallet is <strong>not</strong> a bank, a payment processor, or a licensed financial adviser. It does not
          move money, connect to your bank accounts, or make investment recommendations. Anything myWallet shows
          you is a description of data you entered yourself — not financial advice.
        </p>
      </LegalSection>

      <LegalSection title="3. Your account">
        <p>
          You're responsible for the accuracy of the information you provide and for keeping your password secure.
          You're responsible for all activity under your account. Let us know if you believe your account has been
          compromised.
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>
          Use myWallet only for its intended purpose: tracking your own personal finances. Don't attempt to access
          another user's data, disrupt the service, or use myWallet for anything unlawful.
        </p>
      </LegalSection>

      <LegalSection title="5. Your data">
        <p>
          The financial information you enter belongs to you. See our{" "}
          <Link to="/privacy" className="font-medium text-primary-600 hover:underline dark:text-primary-500">
            Privacy Policy
          </Link>{" "}
          for how it's stored and protected. You can export or delete your data from Settings.
        </p>
      </LegalSection>

      <LegalSection title="6. Service availability">
        <p>
          We aim to keep myWallet available and reliable, but we don't guarantee uninterrupted access. Features may
          change as the product develops. We'll do our best to avoid breaking changes to how your existing data is
          stored.
        </p>
      </LegalSection>

      <LegalSection title="7. Termination">
        <p>
          You may stop using myWallet and delete your account at any time from Settings. We may suspend accounts
          that violate these terms.
        </p>
      </LegalSection>

      <LegalSection title="8. No warranty, limitation of liability">
        <p>
          myWallet is provided "as is," without warranties of any kind. We're not liable for financial decisions
          you make based on information in the app — you remain responsible for your own finances.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to these terms">
        <p>We may update these terms as myWallet develops. Continued use after a change means you accept it.</p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>Questions about these terms? Reach us at support@mywallet.app.</p>
      </LegalSection>
    </LegalLayout>
  );
}
