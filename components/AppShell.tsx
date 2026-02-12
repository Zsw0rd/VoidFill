import Link from "next/link";
import { Sparkles, LayoutDashboard, ClipboardCheck, Route, User, Shield, Radar, Brain, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavItem } from "./NavItem";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-72 p-5">
        <div className="w-full rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl shadow-soft p-5 flex flex-col">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </span>
            <div>
              <div className="font-semibold leading-none">SkillGap AI</div>
              <div className="text-xs text-zinc-400">upskill mode</div>
            </div>
          </Link>

          <nav className="mt-7 space-y-2">
            <NavItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</NavItem>
            <NavItem href="/daily-test" icon={<ClipboardCheck className="w-4 h-4" />}>Daily Test</NavItem>
            <NavItem href="/practice-test" icon={<Dumbbell className="w-4 h-4" />}>Practice Test</NavItem>
            <NavItem href="/skill-graph" icon={<Radar className="w-4 h-4" />}>Skill Graph</NavItem>
            <NavItem href="/roadmap" icon={<Route className="w-4 h-4" />}>Roadmap</NavItem>
            <NavItem href="/ai-insights" icon={<Brain className="w-4 h-4" />}>AI Insights</NavItem>
            <NavItem href="/profile" icon={<User className="w-4 h-4" />}>Profile</NavItem>
            <NavItem href="/admin" icon={<Shield className="w-4 h-4" />}>Admin</NavItem>
          </nav>

          <div className="mt-auto pt-5 border-t border-white/10 text-xs text-zinc-400">
            <div className="truncate">Signed in as</div>
            <div className="text-zinc-200 truncate">{user?.email}</div>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="md:hidden p-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-300" />
            <span className="font-semibold">SkillGap AI</span>
          </Link>
          <Link href="/profile" className="text-sm text-zinc-300">Profile</Link>
        </header>

        <main className="p-4 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
