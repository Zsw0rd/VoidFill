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
        "flex items-center gap-2 rounded-2xl px-3 py-2.5 border border-transparent hover:bg-white/5 text-sm",
        active ? "bg-white/5 border-white/10" : "text-zinc-300",
      )}
    >
      <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center", active ? "bg-emerald-500/15" : "bg-white/5 border border-white/10")}>
        {icon}
      </span>
      <span className="font-medium">{children}</span>
    </Link>
  );
}
