import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { ResumeUI } from "./ui";
export default async function ResumePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const [{ data: profile }, { data: roles }] = await Promise.all([supabase.from("profiles").select("full_name, current_skills_text, target_role_id").eq("id", user.id).maybeSingle(), supabase.from("roles").select("id,name").order("name")]);
  return <AppShell displayName={profile?.full_name || "Learner"}><ResumeUI profile={profile} roles={roles || []} /></AppShell>;
}
