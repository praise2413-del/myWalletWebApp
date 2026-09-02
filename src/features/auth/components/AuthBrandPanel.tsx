import { Logo } from "@/components/layout/Logo";

interface AuthBrandPanelProps {
  headline: string;
  subtext: string;
}

export function AuthBrandPanel({ headline, subtext }: AuthBrandPanelProps) {
  return (
    <div className="relative hidden overflow-hidden bg-primary-900 px-10 py-12 lg:flex lg:w-1/2 lg:flex-col lg:justify-between">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, var(--color-primary-700), transparent 55%), radial-gradient(circle at 85% 80%, var(--color-primary-600), transparent 45%)",
        }}
        aria-hidden="true"
      />

      <Logo variant="light" className="relative" />

      <div className="relative">
        <h1 className="max-w-sm text-3xl font-bold leading-tight text-white">{headline}</h1>
        <p className="mt-3 max-w-sm text-sm text-primary-200">{subtext}</p>
      </div>

      <div className="relative flex justify-center py-6" aria-hidden="true">
        <svg
          width="280"
          height="180"
          viewBox="0 0 280 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="24" y="70" width="200" height="120" rx="16" fill="var(--color-primary-800)" />
          <rect
            x="56"
            y="40"
            width="200"
            height="120"
            rx="16"
            fill="var(--color-primary-700)"
            stroke="var(--color-primary-500)"
            strokeOpacity="0.4"
          />
          <circle cx="90" cy="76" r="14" fill="var(--color-primary-500)" />
          <rect x="112" y="70" width="70" height="8" rx="4" fill="white" fillOpacity="0.7" />
          <rect x="112" y="86" width="46" height="6" rx="3" fill="white" fillOpacity="0.4" />
          <path
            d="M80 140 L110 118 L136 132 L166 96 L200 108"
            stroke="var(--color-primary-400)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="200" cy="108" r="5" fill="var(--color-primary-400)" />
        </svg>
      </div>
    </div>
  );
}
