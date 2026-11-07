import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { CareerExplorer } from "./ui";

export default async function CareersPage() {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const {data: profile} = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile?.onboarded) redirect("/onboarding");
  const [roles, skills, reflections] = await Promise.all([
    supabase.from("roles").select("id,name,description").order("name"),
    supabase.from("skills").select("id,name").order("name"),
    supabase.from("career_reflections").select("role_id,content").eq("user_id", user.id),
  ]);
  if (roles.error || skills.error || reflections.error) throw new Error("Could not load Career explorer. Please try again.");
  return <AppShell displayName={profile.full_name || user.email || "Learner"}><CareerExplorer roles={roles.data || []} skills={skills.data || []} profile={profile} reflections={reflections.data || []} /></AppShell>;
}
