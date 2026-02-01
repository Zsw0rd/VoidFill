"use client";

import { motion } from "framer-motion";
import { cn } from "./cn";

export function Progress({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-3 w-full rounded-full bg-white/5 border border-white/10 overflow-hidden", className)}>
      <motion.div
        className="h-full bg-emerald-400/80"
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
      />
    </div>
  );
}
