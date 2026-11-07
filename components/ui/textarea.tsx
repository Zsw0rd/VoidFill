import * as React from "react";
import { cn } from "./cn";
export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full min-h-[110px] rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/70 outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15",
        className,
      )}
      {...props}
    />
  );
}
