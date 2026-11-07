import { createClient } from "@/lib/supabase/server";
import { AdminShellClient } from "./AdminShellClient";

export async function AdminShell({children, role, displayName: initialDisplayName}: {children: React.ReactNode; role?: string; displayName?: string}) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  const [staff, learner] = user ? await Promise.all([
    supabase.from("admin_users").select("display_name,admin_role").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("onboarded").eq("id", user.id).maybeSingle(),
  ]) : [{data: null}, {data: null}];
  const displayName = initialDisplayName || staff.data?.display_name || user?.email || "Staff";
  return <AdminShellClient displayName={displayName} role={staff.data?.admin_role || role || "admin"} learnerAccess={!!learner.data?.onboarded}>{children}</AdminShellClient>;
}
