import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { RoadmapClient } from "./ui";

export default async function RoadmapPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile?.onboarded) redirect("/onboarding");

  const roleId = profile.target_role_id;
  const { data: role } = roleId ? await supabase.from("roles").select("*").eq("id", roleId).maybeSingle() : { data: null };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <RoadmapClient role={role} />
      </div>
    </AppShell>
  );
}
