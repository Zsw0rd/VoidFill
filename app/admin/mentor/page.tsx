import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MentorDashboardCharts } from "./charts";

export default async function MentorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("admin_role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminUser) redirect("/dashboard");

  // Fetch assigned students · your mentoring circle
  const { data: assignments } = await supabase
    .from("mentor_assignments")
    .select("user_id")
    .eq("mentor_id", user.id);

  const studentIds = (assignments || []).map((a: any) => a.user_id);

  let students: any[] = [];
  let avgSkillData: { skill: string; avgScore: number }[] = [];
  let studentProgressData: { name: string; xp: number; level: number }[] = [];

  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select(
        "id, full_name, course, education_level, user_type, target_role_id, roles(name)",
      )
      .in("id", studentIds);

    const { data: scores } = await supabase
      .from("user_skill_scores")
      .select("user_id, score, skill_id, skills(name)")
      .in("user_id", studentIds);

    const { data: stats } = await supabase
      .from("user_stats")
      .select("user_id, xp, level, streak")
      .in("user_id", studentIds);

    const { data: attempts } = await supabase
      .from("daily_attempts")
      .select("user_id, correct_count, total_count, created_at")
      .in("user_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(50);

    const scoreMap = new Map<string, any[]>();
    (scores || []).forEach((s: any) => {
      if (!scoreMap.has(s.user_id)) scoreMap.set(s.user_id, []);
      scoreMap.get(s.user_id)!.push(s);
    });
    const statsMap = new Map<string, any>();
    (stats || []).forEach((s: any) => statsMap.set(s.user_id, s));
    const attemptMap = new Map<string, any[]>();
    (attempts || []).forEach((a: any) => {
      if (!attemptMap.has(a.user_id)) attemptMap.set(a.user_id, []);
      attemptMap.get(a.user_id)!.push(a);
    });

    students = (profiles || []).map((p: any) => ({
      ...p,
      scores: scoreMap.get(p.id) || [],
      stats: statsMap.get(p.id),
      recentAttempts: (attemptMap.get(p.id) || [])
        .slice(0, 5)
        .map((a: any) => ({
          ...a,
          score: a.total_count
            ? Math.round((a.correct_count / a.total_count) * 100)
            : 0,
        })),
    }));

    // Compute chart data: average score per skill across all students
    const skillTotals = new Map<string, { sum: number; count: number }>();
    (scores || []).forEach((s: any) => {
      const name = s.skills?.name || "Unknown";
      const existing = skillTotals.get(name) || { sum: 0, count: 0 };
      existing.sum += s.score;
      existing.count += 1;
      skillTotals.set(name, existing);
    });
    avgSkillData = Array.from(skillTotals.entries()).map(
      ([skill, { sum, count }]) => ({
        skill,
        avgScore: Math.round(sum / count),
      }),
    );

    // Student progress bar chart data
    studentProgressData = students.map((s) => ({
      name: s.full_name || s.id.slice(0, 8),
      xp: s.stats?.xp || 0,
      level: s.stats?.level || 1,
    }));
  }

  return (
    <AdminShell
      role={adminUser.admin_role}
      displayName={adminUser.display_name || user.email || "Admin"}
    >
      <div className="max-w-5xl mx-auto">
        <h1 className="page-title">Good guidance starts here.</h1>
        <p className="mt-2 text-sm text-muted">
          {students.length > 0
            ? `${students.length} assigned students · your mentoring circle`
            : "No students assigned yet"}
        </p>

        {/* Charts */}
        <MentorDashboardCharts
          avgSkillData={avgSkillData}
          studentProgressData={studentProgressData}
        />

        <div className="mt-6 space-y-4">
          {students.map((s: any) => {
            const avgScore =
              s.scores.length > 0
                ? Math.round(
                    s.scores.reduce(
                      (sum: number, sc: any) => sum + sc.score,
                      0,
                    ) / s.scores.length,
                  )
                : 0;

            return (
              <Card key={s.id} className="bg-surface">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-forest shrink-0">
                      {(s.full_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{s.full_name}</div>
                      <div className="text-xs text-muted">
                        {s.roles?.name || "No role"} ·{" "}
                        {s.course || s.education_level || "N/A"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-forest">
                          {s.stats?.level || 1}
                        </div>
                        <div className="text-[10px] text-muted">Level</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-rust">
                          {s.stats?.streak || 0} days
                        </div>
                        <div className="text-[10px] text-muted">Streak</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {s.scores.map((sc: any) => (
                      <div
                        key={sc.skill_id}
                        className="flex items-center gap-3"
                      >
                        <div className="text-xs text-muted w-32 truncate">
                          {sc.skills?.name}
                        </div>
                        <Progress value={sc.score} className="flex-1 h-2" />
                        <div className="text-xs font-medium w-10 text-right">
                          {sc.score}%
                        </div>
                      </div>
                    ))}
                  </div>

                  {s.recentAttempts.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      <span className="text-[10px] text-muted">Recent:</span>
                      {s.recentAttempts.map((a: any, i: number) => (
                        <Badge
                          key={i}
                          tone={a.score >= 60 ? "good" : "warn"}
                          className="text-[10px]"
                        >
                          {a.score}%
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {students.length === 0 && (
            <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
              No students assigned. Ask your admin to assign students to you.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
