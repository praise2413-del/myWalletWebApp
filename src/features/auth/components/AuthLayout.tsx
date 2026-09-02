import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";
import { AuthBrandPanel } from "@/features/auth/components/AuthBrandPanel";

interface AuthLayoutProps {
  headline: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ headline, title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh bg-background">
      <AuthBrandPanel headline={headline} />

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h2>
          <p className="mt-1.5 text-sm text-text-secondary">{description}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-sm text-text-secondary">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
