import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function MentorPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: adminUser } = await supabase
        .from("admin_users")
        .select("admin_role, display_name")
        .eq("id", user.id)
        .maybeSingle();

    if (!adminUser) redirect("/dashboard");

    // Fetch assigned students
    const { data: assignments } = await supabase
        .from("mentor_assignments")
        .select("user_id")
        .eq("mentor_id", user.id);

    const studentIds = (assignments || []).map((a: any) => a.user_id);

    // Fetch student education data (not personal)
    let students: any[] = [];
    if (studentIds.length > 0) {
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, course, education_level, user_type, target_role_id, roles(name)")
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
            .select("user_id, score, created_at")
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
            recentAttempts: (attemptMap.get(p.id) || []).slice(0, 5),
        }));
    }

    return (
        <AdminShell role={adminUser.admin_role}>
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-semibold">My Students</h1>
                <p className="mt-2 text-sm text-zinc-400">
                    {students.length > 0 ? `${students.length} assigned students` : "No students assigned yet"}
                </p>

                <div className="mt-6 space-y-4">
                    {students.map((s: any) => {
                        const avgScore = s.scores.length > 0
                            ? Math.round(s.scores.reduce((sum: number, sc: any) => sum + sc.score, 0) / s.scores.length)
                            : 0;

                        return (
                            <Card key={s.id} className="bg-white/5">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-300 shrink-0">
                                            {(s.full_name || "?")[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{s.full_name}</div>
                                            <div className="text-xs text-zinc-400">
                                                {s.roles?.name || "No role"} · {s.course || s.education_level || "N/A"}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="text-center">
                                                <div className="font-bold text-emerald-400">{s.stats?.level || 1}</div>
                                                <div className="text-[10px] text-zinc-500">Level</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold text-orange-400">{s.stats?.streak || 0}🔥</div>
                                                <div className="text-[10px] text-zinc-500">Streak</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skill scores */}
                                    <div className="space-y-2">
                                        {s.scores.map((sc: any) => (
                                            <div key={sc.skill_id} className="flex items-center gap-3">
                                                <div className="text-xs text-zinc-400 w-32 truncate">{sc.skills?.name}</div>
                                                <Progress value={sc.score} className="flex-1 h-2" />
                                                <div className="text-xs font-medium w-10 text-right">{sc.score}%</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Recent attempts */}
                                    {s.recentAttempts.length > 0 && (
                                        <div className="mt-3 flex gap-2">
                                            <span className="text-[10px] text-zinc-500">Recent:</span>
                                            {s.recentAttempts.map((a: any, i: number) => (
                                                <Badge key={i} tone={a.score >= 60 ? "good" : "warn"} className="text-[10px]">
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
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-500">
                            No students assigned. Ask your admin to assign students to you.
                        </div>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}
