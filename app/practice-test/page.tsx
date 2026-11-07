import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { loadCareerRequirements } from "@/lib/careerRequirements";
import { hasKnowledgeCoverage } from "@/lib/careerCatalog";
import { PracticeTestClient } from "./ui";

export default async function PracticeTestPage() {
    const supabase = await createClient();
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
    const roleSkills = await loadCareerRequirements(supabase, profile);
    const skillNames = roleSkills.map(rs => rs.skills?.name).filter(name => name && hasKnowledgeCoverage(name));

    return (
        <AppShell displayName={profile.full_name || user.email || "User"}>
            <div className="max-w-4xl mx-auto">
                <PracticeTestClient
                    recentAttempts={recentAttempts || []}
                    skillNames={skillNames}
                />
            </div>
        </AppShell>
    );
}
