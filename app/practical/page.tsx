import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { practicalBriefForStoredRole } from "@/lib/practical";
import { loadPracticalWorkspace, PracticalError } from "@/lib/practicalServer";
import { PracticalStudio } from "./ui";
import "./practical.css";

export const dynamic = "force-dynamic";
export default async function PracticalPage({searchParams}: {searchParams:Promise<{career?:string;level?:string}>}) {
  const requested=await searchParams;
  const client = await createClient();
  const {data: {user}} = await client.auth.getUser();
  if (!user) redirect("/auth/login");
  const [profileResult, rolesResult, workspace] = await Promise.all([
    client.from("profiles").select("full_name,target_role_id,career_level").eq("id", user.id).maybeSingle(),
    client.from("roles").select("id,name").order("name"),
    loadPracticalWorkspace(client, user.id),
  ]);
  if (profileResult.error || rolesResult.error) throw new PracticalError("Could not load career activities.", 503);
  const profile = profileResult.data;
  const choices = (rolesResult.data || []).flatMap(role => {
    const foundation = practicalBriefForStoredRole(role, "foundation");
    const intermediate = practicalBriefForStoredRole(role, "intermediate");
    return foundation && intermediate ? [{id: role.id, name: role.name, foundation, intermediate}] : [];
  });
  if (!choices.length) throw new PracticalError("Career activities are not available yet.", 503);
  const activityRole=typeof requested.career==="string" && choices.some(role=>role.id===requested.career) ? requested.career : profile?.target_role_id || choices[0].id;
  const activityLevel=requested.level==="foundation" || requested.level==="intermediate" ? requested.level : profile?.career_level==="intermediate" ? "intermediate" : "foundation";
  return <AppShell displayName={profile?.full_name || user.email || "Learner"}><PracticalStudio initial={workspace} choices={choices} initialRole={activityRole} initialLevel={activityLevel} /></AppShell>;
}
