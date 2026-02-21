import { createClient } from "@/lib/supabase/server";
import { AdminShellClient } from "./AdminShellClient";

export async function AdminShell({ children, role }: { children: React.ReactNode; role?: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let displayName = user?.email || "Admin";
    if (user) {
        const { data: adminRow } = await supabase.from("admin_users").select("display_name").eq("id", user.id).maybeSingle();
        if (adminRow?.display_name) displayName = adminRow.display_name;
    }

    return (
        <AdminShellClient displayName={displayName} role={role || "admin"}>
            {children}
        </AdminShellClient>
    );
}
