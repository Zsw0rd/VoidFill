import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SkillRow } from "@/components/SkillRow";
import { categoryFromScore } from "@/lib/gapLogic";
import { isoDate } from "@/lib/date";
import { loadCareerRequirements } from "@/lib/careerRequirements";
import { rankLearningSkills, weeklyLearningRoute } from "@/lib/learningPlan";
import { WeeklyRoute } from "@/components/WeeklyRoute";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardCheck,
  Flame,
  Route,
  Sprout,
  Target,
  Zap,
  MessageCircle,
} from "lucide-react";
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(name)")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.onboarded) redirect("/onboarding");

  const [statsRes, skillsRes, attemptsRes, roadmapRes, requirements, dependencyRes] = await Promise.all([
    supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_skill_scores")
      .select("skill_id, score, skills(name)")
      .eq("user_id", user.id)
      .order("score", { ascending: true }),
    supabase
      .from("daily_attempts")
      .select(
        "attempt_date, correct_count, total_count, xp_earned, difficulty_level, completed_at",
      )
      .eq("user_id", user.id)
      .order("attempt_date", { ascending: false })
      .limit(5),
    supabase
      .from("user_roadmap")
      .select("skill_id, priority, progress, skills(name)")
      .eq("user_id", user.id)
      .eq(
        "role_id",
        profile.target_role_id || "00000000-0000-0000-0000-000000000000",
      )
      .order("priority", { ascending: false })
      .limit(100),
    loadCareerRequirements(supabase, profile),
    supabase.from("skill_dependencies").select("prerequisite_skill_id,dependent_skill_id"),
  ]);

  const stats = statsRes.data;
  const recentAttempts = attemptsRes.data || [];
  const activeSkills = new Set(requirements.map(row => row.skill_id));
  const skills = (skillsRes.data || []).filter(row => activeSkills.has(row.skill_id)).slice(0, 6);
  const scoreMap = new Map((skillsRes.data || []).map(row => [row.skill_id, Number(row.score)]));
  const planSkills = rankLearningSkills(requirements.map(row => ({id: row.skill_id, name: row.skills?.name || "Skill", target: row.target, importance: Number(row.weight ?? .8), score: scoreMap.get(row.skill_id) ?? null})), dependencyRes.data || []);
  const partialLoad = statsRes.error || skillsRes.error || attemptsRes.error || roadmapRes.error || dependencyRes.error;
  const roadmapItems = (roadmapRes.data || []).filter(row => activeSkills.has(row.skill_id)).slice(0, 5);

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const streak = stats?.streak ?? 0;
  const levelBase = (level - 1) * 500;
  const intoLevel = xp - levelBase;
  const progress = Math.max(0, Math.min(100, (intoLevel / 500) * 100));

  const roleName =
    profile.custom_target_role ||
    (profile as any)?.roles?.name ||
    "Choose a target role";
  const isStudent = profile.user_type === "student" || !profile.user_type;

  const todayDone = recentAttempts.some(
    (a: any) => a.attempt_date === isoDate(new Date()) && a.completed_at,
  );
  const firstName = (profile.full_name || "there").split(" ")[0];
  return (
    <AppShell displayName={profile.full_name || user.email || "Learner"}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Your growth, at a glance</p>
            <h1 className="page-title">Keep growing, {firstName}.</h1>
            <p className="page-description">
              A little clarity. A little practice. Another step toward your next
              chapter.
            </p>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Badge tone="good">{roleName}</Badge>
            <Badge>{isStudent ? "Student" : "Professional"}</Badge>
          </div>
        </div>
        {partialLoad && <p className="mt-5 rounded-xl border border-rust/30 bg-paper p-4 text-sm" role="alert">Some progress could not be loaded. <Link href="/dashboard" className="underline">Reload your overview</Link> before relying on these suggestions.</p>}
        {!partialLoad && <WeeklyRoute actions={weeklyLearningRoute(planSkills, todayDone)} />}
        <div className="mt-7 grid lg:grid-cols-[1.7fr_1fr] gap-5">
          <section className="rounded-2xl border border-forest/15 bg-[#e8eddc] p-6 md:p-8 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="eyebrow !text-forest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-forest" />
                Your next small win
              </p>
              <span className="text-[10px] text-forest">
                {todayDone
                  ? "Daily check-in complete"
                  : "Made for your current level"}
              </span>
            </div>
            <div className="mt-7 flex gap-5 items-start">
              <span className="hidden sm:flex rounded-2xl bg-lime border border-forest/10 p-4 text-forest">
                {todayDone ? (
                  <Check size={28} strokeWidth={1.4} />
                ) : (
                  <ClipboardCheck size={28} strokeWidth={1.4} />
                )}
              </span>
              <div>
                <h2 className="!text-2xl md:!text-[27px] font-semibold">
                  {todayDone
                    ? "Great work showing up today."
                    : skills.length
                      ? "Make a little progress today."
                      : "Let’s find your starting point."}
                </h2>
                <p className="mt-3 max-w-md text-xs text-forest/90 leading-6">
                  {todayDone
                    ? "Your daily assessment is done. Explore a resource or keep the momentum going with a practice session."
                    : "A focused assessment helps you see where you stand and what deserves your attention next."}
                </p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <Link
                href={todayDone ? "/practice-test" : "/daily-test"}
                className="primary-link !text-xs"
              >
                {todayDone
                  ? "Head to the practice lab"
                  : "Start daily assessment"}
                <ArrowRight size={15} />
              </Link>
              <Link href="/roadmap" className="section-link !text-forest">
                Explore your roadmap <ArrowUpRight size={13} />
              </Link>
            </div>
          </section>
          <section className="panel p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Your momentum</p>
              <Sprout size={18} strokeWidth={1.5} className="text-forest" />
            </div>
            <div className="mt-6 flex items-end gap-3">
              <span className="text-5xl font-semibold tracking-[-.06em]">
                {level.toString().padStart(2, "0")}
              </span>
              <div className="pb-1">
                <span className="block text-xs font-semibold">
                  Activity level
                </span>
                <span className="text-[10px] text-muted">
                  XP tracks participation, not job readiness.
                </span>
              </div>
            </div>
            <div className="mt-5">
              <Progress value={progress} />
              <p className="mt-2 text-[10px] text-muted">
                {Math.max(0, intoLevel)} / 500 XP toward level {level + 1}
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 border-t border-line pt-4">
              <div>
                <span className="flex items-center gap-1.5 text-muted text-[10px]">
                  <Zap size={12} />
                  Total experience
                </span>
                <span className="mt-1 block text-xl font-semibold">
                  {xp.toLocaleString()}{" "}
                  <span className="text-[10px] text-muted font-normal">XP</span>
                </span>
              </div>
              <div className="border-l border-line pl-5">
                <span className="flex items-center gap-1.5 text-muted text-[10px]">
                  <Flame size={12} className="text-rust" />
                  Current streak
                </span>
                <span className="mt-1 block text-xl font-semibold">
                  {streak}{" "}
                  <span className="text-[10px] text-muted font-normal">
                    {streak === 1 ? "day" : "days"}
                  </span>
                </span>
              </div>
            </div>
          </section>
        </div>
        <div className="mt-7 grid lg:grid-cols-[1.1fr_1fr] gap-5">
          <section className="panel p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Target size={17} className="text-rust" />A little extra
                attention
              </h2>
              <Link href="/skill-graph" className="section-link">
                All skills <ArrowUpRight size={13} />
              </Link>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Start with the skills that have the most room to grow.
            </p>
            <div className="mt-5 space-y-3">
              {skills.length ? (
                skills.map((s: any, i: number) => (
                  <SkillRow
                    key={i}
                    name={s.skills?.name || "Skill"}
                    score={Number(s.score ?? 0)}
                    category={categoryFromScore(Number(s.score ?? 0))}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-line p-7 text-center">
                  <Target
                    className="mx-auto text-forest"
                    size={25}
                    strokeWidth={1.3}
                  />
                  <p className="mt-3 text-sm font-semibold">
                    Every journey needs a starting point.
                  </p>
                  <p className="mt-2 text-xs text-muted leading-6">
                    Your first assessment will bring your skill profile to life.
                  </p>
                  <Link href="/daily-test" className="section-link mt-4">
                    Find my baseline <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          </section>
          <section className="panel p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Route size={17} className="text-forest" />
                The path ahead
              </h2>
              <Link href="/roadmap" className="section-link">
                Open roadmap <ArrowUpRight size={13} />
              </Link>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Your highest priority skills, one step at a time.
            </p>
            <div className="mt-6">
              {roadmapItems.length ? (
                roadmapItems.map((item: any, i: number) => (
                  <Link
                    href={`/roadmap?skill=${encodeURIComponent(item.skill_id)}#learning-map`}
                    key={item.skill_id}
                    className="group flex items-start gap-4 py-4 border-b border-line last:border-0"
                  >
                    <span className="text-[10px] text-muted/60 mt-1">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="group-hover:text-forest">
                          {item.skills?.name || "Skill"}
                        </span>
                        <span className="text-muted font-normal">
                          {item.progress || 0}%
                        </span>
                      </div>
                      <div className="mt-3">
                        <Progress value={item.progress || 0} />
                      </div>
                    </div>
                    <ArrowUpRight size={13} className="text-muted" />
                  </Link>
                ))
              ) : (
                <div className="rounded-xl bg-paper p-7">
                  <Sprout size={26} className="text-forest" strokeWidth={1.3} />
                  <h3 className="mt-4 text-sm font-semibold">
                    A path that grows with you.
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-muted">
                    Turn your target role into a focused plan, with resources
                    and milestones along the way.
                  </p>
                  <Link href="/roadmap" className="section-link mt-5">
                    Build my roadmap <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="/ai-insights"
              className="mt-5 flex items-center justify-between rounded-xl bg-paper px-4 py-3 text-[11px] font-semibold"
            >
              See the bigger picture with learning insights{" "}
              <ArrowUpRight size={14} />
            </Link>
          </section>
        </div>
        <section className="mt-7 panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Proof you’re moving forward.</h2>
            <span className="eyebrow">Recent daily assessments</span>
          </div>
          {recentAttempts.length ? (
            <div className="mt-4 divide-y divide-line">
              {recentAttempts.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <span className="h-8 w-8 rounded-lg bg-forest/10 text-forest grid place-items-center">
                    <ClipboardCheck size={14} />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">Daily assessment</p>
                    <p className="text-[10px] text-muted mt-1">
                      {a.attempt_date} · {a.correct_count}/{a.total_count}{" "}
                      correct
                    </p>
                  </div>
                  <Badge
                    tone={
                      a.total_count && a.correct_count / a.total_count >= 0.7
                        ? "good"
                        : "neutral"
                    }
                  >
                    {a.total_count
                      ? Math.round((a.correct_count / a.total_count) * 100)
                      : 0}
                    %
                  </Badge>
                  <span className="text-[11px] font-semibold text-forest w-16 text-right">
                    +{a.xp_earned} XP
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-xs text-muted leading-6">
              Your activity will appear here after your first assessment. Small
              beginnings count.
            </p>
          )}
        </section>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[11px] text-muted">
          <span>Need a little direction?</span>
          <Link
            href="/mentor-chat"
            className="flex items-center gap-2 font-semibold text-forest"
          >
            <MessageCircle size={13} />
            Talk it through with your mentor <ArrowUpRight size={12} />
          </Link>
          <Link href="/resume" className="section-link">
            Bring your resume <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
