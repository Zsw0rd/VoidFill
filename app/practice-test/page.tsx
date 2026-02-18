import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { PracticeTestClient } from "./ui";

export default async function PracticeTestPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!profile?.onboarded) redirect("/onboarding");

    // Get last 5 practice attempts for adaptive difficulty
    const { data: recentAttempts } = await supabase
        .from("practice_attempts")
        .select("score, difficulty_level, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

    // Get user's roadmap skills for question generation
    const roleId = profile.target_role_id;
    const { data: roleSkills } = roleId
        ? await supabase.from("role_skills").select("skill_id, skills(name)").eq("role_id", roleId)
        : { data: [] };

    const skillNames = (roleSkills || []).map((rs: any) => rs.skills?.name).filter(Boolean);

    return (
        <AppShell>
            <div className="max-w-4xl mx-auto">
                <PracticeTestClient
                    recentAttempts={recentAttempts || []}
                    skillNames={skillNames}
                />
            </div>
        </AppShell>
    );
}
