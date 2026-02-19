import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MentorActions } from "./ui";

export default async function AdminMentorsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: adminUser } = await supabase
        .from("admin_users")
        .select("admin_role")
        .eq("id", user.id)
        .maybeSingle();

    if (!adminUser || adminUser.admin_role === "mentor") redirect("/dashboard");

    // Fetch all admin users
    const { data: admins } = await supabase
        .from("admin_users")
        .select("id, admin_role, display_name, created_at")
        .order("created_at", { ascending: true });

    // Fetch mentor assignments with user names
    const { data: assignments } = await supabase
        .from("mentor_assignments")
        .select("mentor_id, user_id, profiles!mentor_assignments_user_id_fkey(full_name, email)");

    // Fetch all non-admin users for assignment dropdown
    const { data: allUsers } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

    const assignMap = new Map<string, any[]>();
    (assignments || []).forEach((a: any) => {
        if (!assignMap.has(a.mentor_id)) assignMap.set(a.mentor_id, []);
        assignMap.get(a.mentor_id)!.push(a);
    });

    return (
        <AdminShell role={adminUser.admin_role}>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-semibold">Staff & Mentors</h1>
                <p className="mt-2 text-sm text-zinc-400">Manage admin users and mentor assignments</p>

                {adminUser.admin_role === "super_admin" && (
                    <MentorActions allUsers={allUsers || []} />
                )}

                <div className="mt-6 space-y-4">
                    {(admins || []).map((a: any) => {
                        const assigned = assignMap.get(a.id) || [];
                        return (
                            <Card key={a.id} className="bg-white/5">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 shrink-0">
                                            {(a.display_name || "?")[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{a.display_name || "Unnamed"}</div>
                                            <div className="text-xs text-zinc-400">ID: {a.id.slice(0, 8)}…</div>
                                        </div>
                                        <Badge
                                            tone={a.admin_role === "super_admin" ? "good" : a.admin_role === "admin" ? "neutral" : "warn"}
                                        >
                                            {a.admin_role.replace("_", " ")}
                                        </Badge>
                                    </div>

                                    {a.admin_role === "mentor" && (
                                        <div className="mt-3 pl-13">
                                            <div className="text-xs text-zinc-400 mb-1">Assigned students ({assigned.length}):</div>
                                            {assigned.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {assigned.map((s: any) => (
                                                        <span key={s.user_id} className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                                                            {s.profiles?.full_name || s.profiles?.email || s.user_id.slice(0, 8)}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-500">No students assigned</span>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}

                    {(admins || []).length === 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-500">
                            No admin users found. Run the admin seed SQL to create a super admin.
                        </div>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}
