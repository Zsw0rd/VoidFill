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
        "group flex items-center gap-2 rounded-2xl px-3 py-2.5 border text-sm transition-colors",
        active ? "border-white/30 bg-white/10 text-white" : "border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5",
      )}
    >
      <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center border transition-colors", active ? "bg-white text-black border-white" : "bg-zinc-900 border-white/10")}>{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
}
