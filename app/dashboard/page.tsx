import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/StatCard";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkillRow } from "@/components/SkillRow";
import { categoryFromScore } from "@/lib/gapLogic";
import { Progress } from "@/components/ui/progress";
import { Brain, Route, Radar, ClipboardCheck, TrendingUp, Calendar } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*, roles(name)").eq("id", user.id).maybeSingle();
  if (!profile?.onboarded) redirect("/onboarding");

  const [statsRes, skillsRes, attemptsRes, roadmapRes] = await Promise.all([
    supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_skill_scores").select("score, skills(name)").eq("user_id", user.id).order("score", { ascending: true }).limit(6),
    supabase.from("daily_attempts").select("attempt_date, correct_count, total_count, xp_earned, difficulty_level").eq("user_id", user.id).order("attempt_date", { ascending: false }).limit(5),
    supabase.from("user_roadmap").select("skill_id, priority, progress, skills(name)").eq("user_id", user.id).order("priority", { ascending: false }).limit(5),
  ]);

  const stats = statsRes.data;
  const skills = skillsRes.data || [];
  const recentAttempts = attemptsRes.data || [];
  const roadmapItems = roadmapRes.data || [];

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const streak = stats?.streak ?? 0;
  const levelBase = (level - 1) * 500;
  const intoLevel = xp - levelBase;
  const progress = Math.max(0, Math.min(100, (intoLevel / 500) * 100));

  const roleName = (profile as any)?.roles?.name || "Not selected";
  const isStudent = profile.user_type === "student" || !profile.user_type;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-400">
              Welcome back, {profile.full_name || "there"} ✨
              {!isStudent && profile.company && <span className="ml-2 text-zinc-500">@ {profile.company}</span>}
            </div>
            <h1 className="text-3xl font-semibold mt-1">Dashboard</h1>
            <div className="mt-2 flex items-center gap-3">
              <Badge tone="neutral">{roleName}</Badge>
              <Badge tone={isStudent ? "good" : "warn"}>{isStudent ? "Student" : "Professional"}</Badge>
            </div>
          </div>
          <Link href="/daily-test" className="rounded-2xl bg-zinc-100/90 hover:bg-zinc-100 px-5 py-3 font-medium text-zinc-950 shadow-soft text-center">
            Take today&apos;s test
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <StatCard title="Level" value={`${level}`} sub={`${intoLevel}/500 XP to next`} progress={progress} />
          <StatCard title="Total XP" value={`${xp}`} sub="Earn XP via tests & completions" />
          <StatCard title="Streak" value={`${streak} 🔥`} sub="Keep it alive daily" />
        </div>

        {/* Main Grid */}
        <div className="mt-8 grid lg:grid-cols-2 gap-4">
          {/* Focus Skills */}
          <Card>
            <CardHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-zinc-200" />
                  <h2 className="text-xl font-semibold">Focus Skills</h2>
                </div>
                <Link href="/skill-graph" className="text-sm text-zinc-200 hover:underline">Skill graph</Link>
              </div>
              <p className="mt-1 text-sm text-zinc-400">Your lowest scoring skills need attention.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {skills.length ? (
                skills.map((s: any, i: number) => {
                  const name = s.skills?.name || "Skill";
                  const score = Number(s.score ?? 0);
                  const cat = categoryFromScore(score);
                  return <SkillRow key={i} name={name} score={score} category={cat} />;
                })
              ) : (
                <div className="text-sm text-zinc-400">
                  No skill scores yet. Take a daily test to get started.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roadmap Progress */}
          <Card>
            <CardHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Route className="w-5 h-5 text-zinc-300" />
                  <h2 className="text-xl font-semibold">Roadmap Progress</h2>
                </div>
                <Link href="/roadmap" className="text-sm text-zinc-200 hover:underline">Full roadmap</Link>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {roadmapItems.length ? (
                roadmapItems.map((item: any, i: number) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.skills?.name || "Skill"}</span>
                      <span className="text-zinc-400">{item.progress || 0}%</span>
                    </div>
                    <Progress value={item.progress || 0} />
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-400">
                  Generate a roadmap from the <Link href="/roadmap" className="text-zinc-200 hover:underline">Roadmap page</Link>.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="p-6 pb-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-zinc-300" />
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {recentAttempts.length ? (
                <div className="space-y-3">
                  {recentAttempts.map((a: any, i: number) => {
                    const pct = a.total_count > 0 ? Math.round((a.correct_count / a.total_count) * 100) : 0;
                    const tone = pct >= 70 ? "good" : pct >= 40 ? "warn" : "bad";
                    return (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                        <div>
                          <div className="text-sm font-medium">{a.attempt_date}</div>
                          <div className="text-xs text-zinc-400">{a.correct_count}/{a.total_count} correct • +{a.xp_earned} XP</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone="neutral">Lvl {a.difficulty_level || 1}</Badge>
                          <Badge tone={tone as any}>{pct}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-zinc-400">No test attempts yet.</div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="p-6 pb-0">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 gap-3">
              <Link href="/daily-test" className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition text-center">
                <ClipboardCheck className="w-6 h-6 text-zinc-200 mx-auto" />
                <div className="mt-2 text-sm font-medium">Daily Test</div>
              </Link>
              <Link href="/skill-graph" className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition text-center">
                <Radar className="w-6 h-6 text-zinc-300 mx-auto" />
                <div className="mt-2 text-sm font-medium">Skill Graph</div>
              </Link>
              <Link href="/roadmap" className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition text-center">
                <Route className="w-6 h-6 text-zinc-300 mx-auto" />
                <div className="mt-2 text-sm font-medium">Roadmap</div>
              </Link>
              <Link href="/ai-insights" className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition text-center">
                <Brain className="w-6 h-6 text-zinc-300 mx-auto" />
                <div className="mt-2 text-sm font-medium">AI Insights</div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
