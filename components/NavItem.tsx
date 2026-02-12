"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";

export function NavItem({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-2xl px-3 py-2.5 border text-sm transition",
        active
          ? "border-white/20 bg-white/[0.08] text-zinc-100"
          : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]",
      )}
    >
      <span
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center transition",
          active ? "bg-white/15 border border-white/25" : "bg-white/5 border border-white/10 group-hover:border-white/20",
        )}
      >
        {icon}
      </span>
      <span className="font-medium tracking-tight">{children}</span>
    </Link>
  );
}
