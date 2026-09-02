import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/layout/Logo";

interface LegalLayoutProps {
  title: string;
  updated: string;
  children: ReactNode;
}

export function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <Link to="/register" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">
            ← Back to sign up
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">{title}</h1>
        <p className="mt-1.5 text-sm text-text-tertiary">Last updated: {updated}</p>

        <div className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-text-secondary">{children}</div>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-text-primary">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
