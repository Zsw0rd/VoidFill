import * as React from "react";
import { cn } from "./cn";
export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const styles = {
    neutral: "bg-paper border-line text-muted",
    good: "bg-forest/10 border-forest/15 text-forest",
    warn: "bg-amber-50 border-amber-200 text-amber-800",
    bad: "bg-rust/10 border-rust/15 text-rust",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-[10px] leading-tight font-semibold",
        styles,
        className,
      )}
      {...props}
    />
  );
}
