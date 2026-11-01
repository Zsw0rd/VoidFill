import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminDashboardCharts } from "./charts";

export default async function AdminDashboardPage() {
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
  if (adminUser.admin_role === "mentor") redirect("/admin/mentor");

  // Stats
  const [usersRes, statsRes, attemptsRes, flaggedRes, mentorsRes] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("user_stats").select("xp, level, streak"),
      supabase
        .from("daily_attempts")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("flagged", true),
      supabase
        .from("admin_users")
        .select("id", { count: "exact", head: true })
        .eq("admin_role", "mentor"),
    ]);

  const totalUsers = usersRes.count || 0;
  const totalAttempts = attemptsRes.count || 0;
  const flaggedCount = flaggedRes.count || 0;
  const mentorCount = mentorsRes.count || 0;

  const allStats = statsRes.data || [];
  const avgXp =
    allStats.length > 0
      ? Math.round(
          allStats.reduce((s, r: any) => s + (r.xp || 0), 0) / allStats.length,
        )
      : 0;
  const avgLevel =
    allStats.length > 0
      ? (
          allStats.reduce((s, r: any) => s + (r.level || 1), 0) /
          allStats.length
        ).toFixed(1)
      : "0";

  // User registration over time (profiles created_at)
  const { data: profileDates } = await supabase
    .from("profiles")
    .select("created_at")
    .order("created_at", { ascending: true });

  // Aggregate by day for chart
  const dateMap = new Map<string, number>();
  (profileDates || []).forEach((p: any) => {
    const d = new Date(p.created_at).toISOString().split("T")[0];
    dateMap.set(d, (dateMap.get(d) || 0) + 1);
  });
  let cumulative = 0;
  const userGrowthData = Array.from(dateMap.entries()).map(([date, count]) => {
    cumulative += count;
    return { date: date.slice(5), users: cumulative, newUsers: count };
  });

  // Level distribution
  const levelBuckets = [0, 0, 0, 0, 0]; // 1-5, 6-10, 11-15, 16-20, 21+
  const levelLabels = ["1-5", "6-10", "11-15", "16-20", "21+"];
  allStats.forEach((s: any) => {
    const lv = s.level || 1;
    if (lv <= 5) levelBuckets[0]++;
    else if (lv <= 10) levelBuckets[1]++;
    else if (lv <= 15) levelBuckets[2]++;
    else if (lv <= 20) levelBuckets[3]++;
    else levelBuckets[4]++;
  });
  const levelDistribution = levelLabels.map((label, i) => ({
    level: label,
    count: levelBuckets[i],
  }));

  return (
    <AdminShell
      role={adminUser.admin_role}
      displayName={adminUser.display_name || user.email || "Admin"}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <h1 className="page-title">The community, in motion.</h1>
          <Badge
            tone={adminUser.admin_role === "super_admin" ? "good" : "neutral"}
          >
            {adminUser.admin_role.replace("_", " ")}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted">
          Welcome back, {adminUser.display_name || user.email}
        </p>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Registered learners"
            value={totalUsers}
            color="emerald"
          />
          <StatCard
            label="Daily assessments"
            value={totalAttempts}
            color="indigo"
          />
          <StatCard label="Average experience" value={avgXp} color="amber" />
          <StatCard label="Average level" value={avgLevel} color="purple" />
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Card className="bg-paper-soft">
            <CardContent className="p-5">
              <div className="text-2xl font-bold text-sky">{mentorCount}</div>
              <div className="text-xs text-muted mt-1">Active Mentors</div>
            </CardContent>
          </Card>
          <Card
            className={`bg-paper-soft ${flaggedCount > 0 ? "border-rose-500/20" : ""}`}
          >
            <CardContent className="p-5">
              <div
                className={`text-2xl font-bold ${flaggedCount > 0 ? "text-rust" : "text-muted"}`}
              >
                {flaggedCount}
              </div>
              <div className="text-xs text-muted mt-1">Flagged Messages</div>
            </CardContent>
          </Card>
        </div>

        {/* Graphs */}
        <AdminDashboardCharts
          userGrowthData={userGrowthData}
          levelDistribution={levelDistribution}
        />
      </div>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-forest",
    indigo: "text-sky",
    amber: "text-amber-800",
    purple: "text-sky",
  };
  return (
    <Card className="bg-paper-soft">
      <CardContent className="p-5 text-center">
        <div
          className={`text-2xl font-bold ${colorMap[color] || "text-forest"}`}
        >
          {value}
        </div>
        <div className="text-xs text-muted mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}
