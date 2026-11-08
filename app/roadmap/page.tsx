import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { RoadmapClient } from "./ui";
import { assessmentContextKey } from "@/lib/assessmentContext";

export default async function RoadmapPage({ searchParams }: { searchParams: Promise<{ skill?: string }> }) {
  const requested = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile?.onboarded) redirect("/onboarding");

  const roleId = profile.target_role_id;
  const { data: role } = roleId ? await supabase.from("roles").select("*").eq("id", roleId).maybeSingle() : { data: null };

  return (
    <AppShell displayName={profile.full_name || user.email || "User"}>
      <div className="atlas-roadmap-page">
        <RoadmapClient ownerId={user.id} contextKey={assessmentContextKey(profile)} role={role ? {...role, trackName: role.name, name: profile.custom_target_role || role.name} : null} preferences={profile} initialSkillId={typeof requested.skill === "string" ? requested.skill : undefined} initialViewMode={profile.roadmap_view_mode || "tree"} />
      </div>
    </AppShell>
  );
}
