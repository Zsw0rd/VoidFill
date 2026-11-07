"use client";

import { motion } from "framer-motion";
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
      <motion.div
        className="h-full bg-forest rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
      />
    </div>
  );
}
