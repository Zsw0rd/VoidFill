import * as React from "react";
import { cn } from "./cn";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "soft" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 font-medium transition duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-white text-black hover:bg-zinc-200 shadow-soft",
    soft: "bg-zinc-900/80 hover:bg-zinc-800 border border-white/15 text-zinc-100",
    ghost: "text-zinc-300 hover:bg-white/10 hover:text-white",
  }[variant];
  return <button className={cn(base, styles, className)} {...props} />;
}
