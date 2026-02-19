import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/StatCard";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkillRow } from "@/components/SkillRow";
import { categoryFromScore } from "@/lib/gapLogic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile?.onboarded) redirect("/onboarding");

  const { data: stats } = await supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle();

  const { data: skills } = await supabase
    .from("user_skill_scores")
    .select("score, skills(name)")
    .eq("user_id", user.id)
    .order("score", { ascending: true })
    .limit(4);

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const streak = stats?.streak ?? 0;
  const levelBase = (level - 1) * 500;
  const intoLevel = xp - levelBase;
  const progress = Math.max(0, Math.min(100, (intoLevel / 500) * 100));

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-400">Hey {profile.full_name || "there"} ✨</div>
            <h1 className="text-3xl font-semibold mt-1">Your skill dashboard</h1>
            <div className="mt-2 text-sm text-zinc-400">
              Target role:{" "}
              <Badge className="ml-2" tone="neutral">
                {profile.target_role_id ? "Selected" : "Not selected"}
              </Badge>
            </div>
          </div>
          <Link href="/daily-test" className="rounded-2xl bg-emerald-500/90 hover:bg-emerald-500 px-5 py-3 font-medium text-zinc-950 shadow-soft text-center">
            Take today’s test
          </Link>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <StatCard title="Level" value={`${level}`} sub={`${intoLevel}/500 XP to next`} progress={progress} />
          <StatCard title="XP" value={`${xp}`} sub="Earn XP via daily tests + completions" />
          <StatCard title="Streak" value={`${streak} 🔥`} sub="Keep it alive daily" />
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Focus skills</h2>
                <Link href="/roadmap" className="text-sm text-emerald-300 hover:underline">Open roadmap</Link>
              </div>
              <p className="mt-1 text-sm text-zinc-400">Your lowest scoring skills first.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {skills?.length ? (
                skills.map((s, i) => {
                  const name = (s as any).skills?.name || "Skill";
                  const score = Number((s as any).score ?? 0);
                  const cat = categoryFromScore(score);
                  return <SkillRow key={i} name={name} score={score} category={cat} />;
                })
              ) : (
                <div className="text-sm text-zinc-400">
                  No skill scores yet. Take a daily test to generate your first roadmap.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-6 pb-0">
              <h2 className="text-xl font-semibold">Today’s mission</h2>
              <p className="mt-1 text-sm text-zinc-400">Small steps. Big outcomes.</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-zinc-400">Mission</div>
                <div className="mt-1 text-lg font-semibold">Complete the Daily Test</div>
                <div className="mt-2 text-sm text-zinc-300 leading-relaxed">
                  Your roadmap gets smarter each day. Keep your streak alive and unlock higher priority skills.
                </div>
                <Link href="/daily-test" className="mt-4 inline-flex rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 font-medium">
                  Start now
                </Link>
              </div>

              <div className="mt-4 text-xs text-zinc-500">
                Next: resource tracking + adaptive difficulty (upgrade in roadmap).
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
