import { createClient } from "@/lib/supabase/server";
import { AppShellClient } from "./AppShellClient";

export async function AppShell({
  children,
  displayName: initialDisplayName,
}: {
  children: React.ReactNode;
  displayName?: string;
}) {
  let displayName = initialDisplayName;

  if (!displayName) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    displayName = user?.email || "User";
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (profile?.full_name) displayName = profile.full_name;
    }
  }

  return (
    <AppShellClient displayName={displayName || "User"}>
      {children}
    </AppShellClient>
  );
}
