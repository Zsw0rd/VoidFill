import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "./ui";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*, roles(name)").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding");

  // Fetch skill scores for radar
  const { data: roleSkills } = await supabase
    .from("role_skills")
    .select("skill_id, weight, skills(name)")
    .eq("role_id", profile.target_role_id || "");

  const { data: userScores } = await supabase
    .from("user_skill_scores")
    .select("skill_id, score, skills(name)")
    .eq("user_id", user.id);

  // Fetch user stats
  const { data: stats } = await supabase
    .from("user_stats")
    .select("xp, level, streak")
    .eq("user_id", user.id)
    .maybeSingle();

  // Fetch recent daily attempts for score trend
  const { data: attempts } = await supabase
    .from("daily_attempts")
    .select("attempt_date, score, attempt_skill_scores(score, skills(name))")
    .eq("user_id", user.id)
    .order("attempt_date", { ascending: true })
    .limit(20);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <ProfileEditor
          initial={profile}
          userId={user.id}
          roleSkills={roleSkills || []}
          userScores={userScores || []}
          stats={stats}
          attemptHistory={attempts || []}
        />
      </div>
    </AppShell>
  );
}
