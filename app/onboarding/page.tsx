import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { OnboardingForm } from "./ui";

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (profile?.onboarded) redirect("/dashboard");

  const { data: roles } = await supabase.from("roles").select("id,name,description").order("name");

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <OnboardingForm roles={roles || []} />
      </div>
    </AppShell>
  );
}
