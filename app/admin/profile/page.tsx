import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { AdminProfileEditor } from "./ui";

export default async function AdminProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/admin-login");

    const { data: adminRow } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (!adminRow) redirect("/auth/admin-login");

    return (
        <AdminShell role={adminRow.admin_role}>
            <AdminProfileEditor
                userId={user.id}
                email={user.email || ""}
                displayName={adminRow.display_name || ""}
                role={adminRow.admin_role}
            />
        </AdminShell>
    );
}
