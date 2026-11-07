import * as React from "react";
import { cn } from "./cn";
export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full min-h-12 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/70 outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15 disabled:bg-paper-soft disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
