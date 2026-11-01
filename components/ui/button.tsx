import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";
export function Button({
  className,
  variant = "primary",
  loading = false,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "soft";
  loading?: boolean;
}) {
  const styles = {
    primary: "bg-ink text-white hover:bg-forest border border-transparent",
    soft: "bg-surface text-ink border border-line hover:bg-paper-soft",
    ghost:
      "text-muted hover:bg-paper-soft hover:text-ink border border-transparent",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed",
        styles,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
