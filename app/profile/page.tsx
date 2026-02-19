import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "./ui";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding");

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <ProfileEditor initial={profile} />
      </div>
    </AppShell>
  );
}
