import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { AdminProfileEditor } from "./ui";
import Link from "next/link";

export default async function AdminProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/admin-login");

    const { data: adminRow } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (!adminRow) redirect("/auth/admin-login");

    return (
        <AdminShell role={adminRow.admin_role} displayName={adminRow.display_name || user.email || "Admin"}>
            <div className="mb-6 flex flex-wrap gap-5"><Link href="/account" className="secondary-link">Account & privacy ↗</Link>{["admin", "super_admin"].includes(adminRow.admin_role) && <Link href="/admin/account-requests" className="secondary-link">Account requests ↗</Link>}</div>
            <AdminProfileEditor
                userId={user.id}
                email={user.email || ""}
                displayName={adminRow.display_name || ""}
                role={adminRow.admin_role}
            />
        </AdminShell>
    );
}
