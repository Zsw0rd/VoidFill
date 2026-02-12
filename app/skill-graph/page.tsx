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

    const { data: roleSkills } = roleId
        ? await supabase.from("role_skills").select("skill_id, weight, skills(name)").eq("role_id", roleId)
        : { data: [] };

    const { data: userScores } = await supabase
        .from("user_skill_scores")
        .select("skill_id, score, skills(name)")
        .eq("user_id", user.id);

    return (
        <AppShell>
            <div className="max-w-6xl mx-auto">
                <SkillGraphClient
                    role={role}
                    roleSkills={roleSkills || []}
                    userScores={userScores || []}
                />
            </div>
        </AppShell>
    );
}
