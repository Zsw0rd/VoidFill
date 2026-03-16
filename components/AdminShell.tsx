import { createClient } from "@/lib/supabase/server";
import { AdminShellClient } from "./AdminShellClient";

export async function AdminShell({
    children,
    role,
    displayName: initialDisplayName,
}: {
    children: React.ReactNode;
    role?: string;
    displayName?: string;
}) {
    let displayName = initialDisplayName;

    if (!displayName) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        displayName = user?.email || "Admin";
        if (user) {
            const { data: adminRow } = await supabase.from("admin_users").select("display_name").eq("id", user.id).maybeSingle();
            if (adminRow?.display_name) displayName = adminRow.display_name;
        }
    }

    return (
        <AdminShellClient displayName={displayName || "Admin"} role={role || "admin"}>
            {children}
        </AdminShellClient>
    );
}
