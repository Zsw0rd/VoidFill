import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { SkillGraphClient } from "./ui";

export default async function SkillGraphPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!profile?.onboarded) redirect("/onboarding");

    const roleId = profile.target_role_id;
    const { data: role } = roleId ? await supabase.from("roles").select("*").eq("id", roleId).maybeSingle() : { data: null };

    const [roleSkillsRes, userScoresRes, attemptsRes] = await Promise.all([
        roleId
            ? supabase.from("role_skills").select("skill_id, weight, skills(name)").eq("role_id", roleId)
            : Promise.resolve({ data: [] }),
        supabase.from("user_skill_scores").select("skill_id, score, skills(name)").eq("user_id", user.id),
        supabase.from("daily_attempts").select("attempt_date, attempt_skill_scores(skill_id, score, skills(name))").eq("user_id", user.id).order("attempt_date", { ascending: true }).limit(20),
    ]);

    return (
        <AppShell>
            <div className="max-w-6xl mx-auto">
                <SkillGraphClient
                    role={role}
                    roleSkills={roleSkillsRes.data || []}
                    userScores={userScoresRes.data || []}
                    attemptHistory={attemptsRes.data || []}
                />
            </div>
        </AppShell>
    );
}
