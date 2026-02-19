import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminFlaggedPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: adminUser } = await supabase
        .from("admin_users")
        .select("admin_role")
        .eq("id", user.id)
        .maybeSingle();

    if (!adminUser || adminUser.admin_role === "mentor") redirect("/dashboard");

    // Fetch flagged messages with conversation and sender info
    const { data: flagged } = await supabase
        .from("chat_messages")
        .select("id, content, flag_reason, sender_role, created_at, conversation_id, chat_conversations(user_id, profiles!chat_conversations_user_id_fkey(full_name, email))")
        .eq("flagged", true)
        .order("created_at", { ascending: false })
        .limit(50);

    return (
        <AdminShell role={adminUser.admin_role}>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-semibold">Flagged Messages</h1>
                <p className="mt-2 text-sm text-zinc-400">{(flagged || []).length} messages flagged by AI moderation</p>

                <div className="mt-6 space-y-3">
                    {(flagged || []).map((m: any) => {
                        const conv = m.chat_conversations;
                        const userName = conv?.profiles?.full_name || conv?.profiles?.email || "Unknown user";

                        return (
                            <Card key={m.id} className="bg-white/5 border-rose-500/10">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xs font-bold text-rose-300 shrink-0 mt-0.5">
                                            !
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{userName}</span>
                                                <Badge tone="warn" className="text-[10px]">{m.sender_role}</Badge>
                                                <span className="text-[10px] text-zinc-500">{new Date(m.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="mt-1 text-sm text-zinc-300 leading-relaxed">{m.content}</div>
                                            {m.flag_reason && (
                                                <div className="mt-2 text-xs text-rose-400 bg-rose-500/5 rounded-lg px-3 py-1.5 border border-rose-500/10">
                                                    Reason: {m.flag_reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {(flagged || []).length === 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-500">
                            ✅ No flagged messages — all chats are clean!
                        </div>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}
