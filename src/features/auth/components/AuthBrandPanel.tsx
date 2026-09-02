import { BarChart3, PieChart, Quote, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

interface AuthBrandPanelProps {
  headline: string;
}

const TAGLINE = "Track, analyze, and understand your money like never before.";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Track Your Finances",
    description: "Log income, expenses, savings and investments with ease.",
  },
  {
    icon: PieChart,
    title: "Gain Valuable Insights",
    description: "Understand your spending patterns and build better habits.",
  },
  {
    icon: ShieldCheck,
    title: "Your Data, Secure",
    description: "Bank-level security to keep your financial data protected.",
  },
];

export function AuthBrandPanel({ headline }: AuthBrandPanelProps) {
  return (
    <div
      className="relative hidden overflow-hidden px-10 py-10 lg:flex lg:w-1/2 lg:flex-col lg:justify-center"
      style={{
        background:
          "radial-gradient(120% 90% at 82% 8%, #0e7a56 0%, transparent 46%), #041d19",
      }}
    >
      <img
        src="/illustrations/auth-brand-illustration.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[64%] object-cover object-left"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 32%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 32%)",
        }}
      />

      <div className="relative flex max-w-sm flex-col">
        <Logo variant="light" />

        <span className="mt-16 inline-flex w-fit items-center rounded-full border border-primary-400/30 bg-primary-400/10 px-4 py-1.5 text-xs font-medium text-primary-300">
          Smart &bull; Simple &bull; Secure
        </span>

        <h1 className="mt-8 text-4xl font-bold leading-tight text-white">{headline}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">{TAGLINE}</p>

        <ul className="mt-10 space-y-6">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <feature.icon className="size-5 text-white" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="pt-1.5">
                <p className="text-[15px] font-semibold text-white">{feature.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-white/55">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
          <Quote className="size-6 fill-primary-400 text-primary-400" aria-hidden="true" />
          <p className="mt-2 text-[15px] leading-relaxed text-white/85">
            Financial freedom starts with knowing where you stand.
          </p>
        </div>
      </div>
    </div>
  );
}
