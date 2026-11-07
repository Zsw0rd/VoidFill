import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { loadCareerRequirements } from "@/lib/careerRequirements";
import { SkillGraphClient } from "./ui";

export default async function SkillGraphPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.onboarded) redirect("/onboarding");

  const roleId = profile.target_role_id;
  const { data: role } = roleId
    ? await supabase.from("roles").select("*").eq("id", roleId).maybeSingle()
    : { data: null };

  const [roleSkillsRes, userScoresRes, attemptsRes, practiceRes] =
    await Promise.all([
      loadCareerRequirements(supabase, profile),
      supabase
        .from("user_skill_scores")
        .select("skill_id, score, skills(name)")
        .eq("user_id", user.id),
      supabase
        .from("daily_attempts")
        .select(
          "attempt_date, correct_count, total_count, attempt_skill_scores(skill_id, score, skills(name))",
        )
        .eq("user_id", user.id)
        .order("attempt_date", { ascending: true })
        .limit(20),
      supabase
        .from("practice_attempts")
        .select("score, difficulty_level, skill_scores, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(30),
    ]);

  return (
    <AppShell displayName={profile.full_name || user.email || "User"}>
      <div className="max-w-6xl mx-auto">
        <SkillGraphClient
          role={role ? {...role, name: profile.custom_target_role || role.name} : null}
          roleSkills={roleSkillsRes}
          userScores={userScoresRes.data || []}
          attemptHistory={attemptsRes.data || []}
          practiceHistory={practiceRes.data || []}
        />
      </div>
    </AppShell>
  );
}
