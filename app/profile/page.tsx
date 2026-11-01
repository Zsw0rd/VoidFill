import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "./ui";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(name)")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");

  const { data: roles } = await supabase
    .from("roles")
    .select("id,name")
    .order("name");

  // Fetch skill scores for radar
  const { data: roleSkills } = profile.target_role_id
    ? await supabase
        .from("role_skills")
        .select("skill_id, weight, skills(name)")
        .eq("role_id", profile.target_role_id)
    : { data: [] };

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
    .select(
      "attempt_date, correct_count, total_count, attempt_skill_scores(score, skills(name))",
    )
    .eq("user_id", user.id)
    .order("attempt_date", { ascending: true })
    .limit(20);

  return (
    <AppShell displayName={profile.full_name || user.email || "User"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Your story, so far</p>
            <h1 className="page-title">Your learning profile.</h1>
          </div>
          <Link href="/resume" className="secondary-link !text-xs">
            Update from your resume ↗
          </Link>
        </div>
        <ProfileEditor
          initial={profile}
          roles={roles || []}
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
