import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminUsersPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: adminUser } = await supabase
        .from("admin_users")
        .select("admin_role")
        .eq("id", user.id)
        .maybeSingle();

    if (!adminUser || adminUser.admin_role === "mentor") redirect("/dashboard");

    // Fetch all users with their stats and skill scores
    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, course, role, onboarded, created_at")
        .order("created_at", { ascending: false });

    const { data: stats } = await supabase.from("user_stats").select("user_id, xp, level, streak");
    const { data: scores } = await supabase.from("user_skill_scores").select("user_id, score");

    const statsMap = new Map<string, any>();
    (stats || []).forEach((s: any) => statsMap.set(s.user_id, s));

    const scoreMap = new Map<string, number>();
    const scoreCounts = new Map<string, number>();
    (scores || []).forEach((s: any) => {
        scoreMap.set(s.user_id, (scoreMap.get(s.user_id) || 0) + s.score);
        scoreCounts.set(s.user_id, (scoreCounts.get(s.user_id) || 0) + 1);
    });

    return (
        <AdminShell role={adminUser.admin_role}>
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-semibold">All Users</h1>
                <p className="mt-2 text-sm text-zinc-400">{(profiles || []).length} registered users</p>

                <div className="mt-6 space-y-3">
                    {(profiles || []).map((p: any) => {
                        const s = statsMap.get(p.id);
                        const avgScore = scoreCounts.get(p.id)
                            ? Math.round((scoreMap.get(p.id) || 0) / scoreCounts.get(p.id)!)
                            : 0;

                        return (
                            <Card key={p.id} className="bg-white/5">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-300 shrink-0">
                                        {(p.full_name || "?")[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{p.full_name || "Unknown"}</div>
                                        <div className="text-xs text-zinc-400 truncate">{p.email} · {p.course || "No course"}</div>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-4 text-sm text-zinc-300">
                                        <div className="text-center">
                                            <div className="font-bold text-emerald-400">{s?.level || 1}</div>
                                            <div className="text-[10px] text-zinc-500">Level</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-indigo-400">{s?.xp || 0}</div>
                                            <div className="text-[10px] text-zinc-500">XP</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-amber-400">{avgScore}%</div>
                                            <div className="text-[10px] text-zinc-500">Avg</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-orange-400">{s?.streak || 0}🔥</div>
                                            <div className="text-[10px] text-zinc-500">Streak</div>
                                        </div>
                                    </div>
                                    <Badge tone={p.onboarded ? "good" : "warn"} className="shrink-0">
                                        {p.onboarded ? "Active" : "New"}
                                    </Badge>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {(profiles || []).length === 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-500">
                            No users registered yet.
                        </div>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}
