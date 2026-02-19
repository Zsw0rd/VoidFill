import Link from "next/link";
import { Sparkles, LayoutDashboard, ClipboardCheck, Route, User, Radar, Brain, Dumbbell, MessageCircle, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavItem } from "./NavItem";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch full name for display
  let displayName = user?.email || "User";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    if (profile?.full_name) displayName = profile.full_name;
  }

  return (
    <div className="min-h-screen flex bg-transparent">
      <aside className="hidden md:flex w-72 p-5">
        <div className="w-full rounded-3xl border border-white/15 bg-black/70 backdrop-blur-2xl shadow-soft p-5 flex flex-col">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-white text-black border border-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="font-semibold leading-none tracking-tight">SkillGap AI</div>
              <div className="text-xs text-zinc-500">focused learning</div>
            </div>
          </Link>

          <nav className="mt-7 space-y-2">
            <NavItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</NavItem>
            <NavItem href="/daily-test" icon={<ClipboardCheck className="w-4 h-4" />}>Daily Test</NavItem>
            <NavItem href="/practice-test" icon={<Dumbbell className="w-4 h-4" />}>Practice Test</NavItem>
            <NavItem href="/skill-graph" icon={<Radar className="w-4 h-4" />}>Skill Graph</NavItem>
            <NavItem href="/roadmap" icon={<Route className="w-4 h-4" />}>Roadmap</NavItem>
            <NavItem href="/ai-insights" icon={<Brain className="w-4 h-4" />}>AI Insights</NavItem>
            <NavItem href="/mentor-chat" icon={<MessageCircle className="w-4 h-4" />}>AI Mentor</NavItem>
            <NavItem href="/profile" icon={<User className="w-4 h-4" />}>Profile</NavItem>
          </nav>

          <div className="mt-auto pt-5 border-t border-white/10 text-xs text-zinc-500">
            <div className="truncate uppercase tracking-[0.2em] text-[10px]">Signed in as</div>
            <div className="text-zinc-200 truncate mt-1">{displayName}</div>
            <Link href="/auth/logout" className="mt-3 flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition">
              <LogOut className="w-3 h-3" />
              Sign out
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="md:hidden p-4 flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur-xl">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="font-semibold">SkillGap AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/profile" className="text-sm text-zinc-300">Profile</Link>
            <Link href="/auth/logout" className="text-sm text-zinc-400 hover:text-zinc-200"><LogOut className="w-4 h-4" /></Link>
          </div>
        </header>

        <main className="p-4 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
