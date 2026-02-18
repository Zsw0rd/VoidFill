import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: adminUser } = await supabase
        .from("admin_users")
        .select("admin_role, display_name")
        .eq("id", user.id)
        .maybeSingle();

    if (!adminUser) redirect("/dashboard");

    // If mentor, redirect to mentor page
    if (adminUser.admin_role === "mentor") redirect("/admin/mentor");

    // Fetch stats
    const [usersRes, statsRes, attemptsRes, flaggedRes, mentorsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_stats").select("xp, level, streak"),
        supabase.from("daily_attempts").select("id", { count: "exact", head: true }),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("flagged", true),
        supabase.from("admin_users").select("id", { count: "exact", head: true }).eq("admin_role", "mentor"),
    ]);

    const totalUsers = usersRes.count || 0;
    const totalAttempts = attemptsRes.count || 0;
    const flaggedCount = flaggedRes.count || 0;
    const mentorCount = mentorsRes.count || 0;

    const allStats = statsRes.data || [];
    const avgXp = allStats.length > 0 ? Math.round(allStats.reduce((s, r: any) => s + (r.xp || 0), 0) / allStats.length) : 0;
    const avgLevel = allStats.length > 0 ? (allStats.reduce((s, r: any) => s + (r.level || 1), 0) / allStats.length).toFixed(1) : "0";

    return (
        <AdminShell role={adminUser.admin_role}>
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
                    <Badge tone={adminUser.admin_role === "super_admin" ? "good" : "neutral"}>
                        {adminUser.admin_role.replace("_", " ")}
                    </Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-400">Welcome back, {adminUser.display_name || user.email}</p>

                <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Users" value={totalUsers} />
                    <StatCard label="Total Tests" value={totalAttempts} />
                    <StatCard label="Avg XP" value={avgXp} />
                    <StatCard label="Avg Level" value={avgLevel} />
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                    <Card className="bg-white/5">
                        <CardContent className="p-5">
                            <div className="text-2xl font-bold text-indigo-400">{mentorCount}</div>
                            <div className="text-xs text-zinc-400 mt-1">Active Mentors</div>
                        </CardContent>
                    </Card>
                    <Card className={`bg-white/5 ${flaggedCount > 0 ? "border-rose-500/20" : ""}`}>
                        <CardContent className="p-5">
                            <div className={`text-2xl font-bold ${flaggedCount > 0 ? "text-rose-400" : "text-zinc-400"}`}>{flaggedCount}</div>
                            <div className="text-xs text-zinc-400 mt-1">Flagged Messages</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminShell>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <Card className="bg-white/5">
            <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-emerald-400">{value}</div>
                <div className="text-xs text-zinc-400 mt-1">{label}</div>
            </CardContent>
        </Card>
    );
}
