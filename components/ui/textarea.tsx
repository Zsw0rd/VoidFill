import * as React from "react";
import { cn } from "./cn";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full min-h-[110px] rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30",
        className,
      )}
      {...props}
    />
  );
}
