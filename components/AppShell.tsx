import { createClient } from "@/lib/supabase/server";
import { AppShellClient } from "./AppShellClient";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName = user?.email || "User";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    if (profile?.full_name) displayName = profile.full_name;
  }

  return (
    <AppShellClient displayName={displayName}>
      {children}
    </AppShellClient>
  );
}
