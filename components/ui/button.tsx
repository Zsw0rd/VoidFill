import * as React from "react";
import { cn } from "./cn";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "soft" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 font-medium transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-zinc-100/90 hover:bg-zinc-100 text-zinc-950 shadow-soft",
    soft: "bg-white/5 hover:bg-white/10 border border-white/10",
    ghost: "hover:bg-white/10",
  }[variant];
  return <button className={cn(base, styles, className)} {...props} />;
}
