import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, variant = "default" }: { className?: string; variant?: "default" | "light" }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary-600">
        <Wallet className="size-4.5 text-white" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span
        className={cn(
          "text-lg font-bold tracking-tight",
          variant === "light" ? "text-white" : "text-text-primary",
        )}
      >
        myWallet
      </span>
    </div>
  );
}
