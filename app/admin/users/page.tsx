import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/AdminShell";
import { LearnerDirectory } from "./directory";

export default async function AdminUsersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("admin_role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminUser || adminUser.admin_role === "mentor") redirect("/dashboard");

  // Fetch all users with their stats and skill scores
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, course, role, onboarded, created_at")
    .order("created_at", { ascending: false });

  const { data: stats } = await supabase
    .from("user_stats")
    .select("user_id, xp, level, streak");
  const { data: scores } = await supabase
    .from("user_skill_scores")
    .select("user_id, score");

  const statsMap = new Map<string, any>();
  (stats || []).forEach((s: any) => statsMap.set(s.user_id, s));

  const scoreMap = new Map<string, number>();
  const scoreCounts = new Map<string, number>();
  (scores || []).forEach((s: any) => {
    scoreMap.set(s.user_id, (scoreMap.get(s.user_id) || 0) + s.score);
    scoreCounts.set(s.user_id, (scoreCounts.get(s.user_id) || 0) + 1);
  });

  const learners = (profiles || []).map((p: any) => ({
    id: p.id,
    name: p.full_name || "Learner",
    email: p.email || "",
    course: p.course || "",
    active: !!p.onboarded,
    xp: statsMap.get(p.id)?.xp || 0,
    level: statsMap.get(p.id)?.level || 1,
    streak: statsMap.get(p.id)?.streak || 0,
    score: scoreCounts.get(p.id)
      ? Math.round((scoreMap.get(p.id) || 0) / scoreCounts.get(p.id)!)
      : null,
  }));
  return (
    <AdminShell
      role={adminUser.admin_role}
      displayName={adminUser.display_name || user.email || "Admin"}
    >
      <LearnerDirectory learners={learners} />
    </AdminShell>
  );
}
