import * as React from "react";
import { cn } from "./cn";

export function Badge({ className, tone = "neutral", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "good" | "warn" | "bad" }) {
  const styles = {
    neutral: "bg-white/5 border-white/10 text-zinc-200",
    good: "bg-zinc-100/15 border-zinc-100/30 text-zinc-200",
    warn: "bg-zinc-600/15 border-zinc-600/30 text-zinc-200",
    bad: "bg-zinc-700/15 border-zinc-700/30 text-rose-200",
  }[tone];

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", styles, className)} {...props} />
  );
}
