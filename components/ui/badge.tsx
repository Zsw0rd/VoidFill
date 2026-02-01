import * as React from "react";
import { cn } from "./cn";

export function Badge({ className, tone = "neutral", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "good" | "warn" | "bad" }) {
  const styles = {
    neutral: "bg-white/5 border-white/10 text-zinc-200",
    good: "bg-emerald-500/15 border-emerald-500/30 text-emerald-200",
    warn: "bg-amber-500/15 border-amber-500/30 text-amber-200",
    bad: "bg-rose-500/15 border-rose-500/30 text-rose-200",
  }[tone];

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", styles, className)} {...props} />
  );
}
