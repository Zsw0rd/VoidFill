import * as React from "react";
import { cn } from "./cn";

export function Badge({ className, tone = "neutral", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "good" | "warn" | "bad" }) {
  const styles = {
    neutral: "bg-white/5 border-white/15 text-zinc-200",
    good: "bg-white/10 border-white/25 text-white",
    warn: "bg-zinc-800 border-zinc-600 text-zinc-100",
    bad: "bg-zinc-900 border-zinc-700 text-zinc-300",
  }[tone];

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", styles, className)} {...props} />
  );
}
