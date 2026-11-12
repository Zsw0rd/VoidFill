"use client";

import { cn } from "./cn";

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progress"
      className={cn(
        "h-1.5 w-full rounded-full bg-paper-soft overflow-hidden",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-forest transition-[width] duration-300 ease-out motion-reduce:transition-none"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
