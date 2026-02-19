import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/AdminShell";
import { MentorChatPanel } from "./ui";

export default async function MentorChatPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: adminUser } = await supabase
        .from("admin_users")
        .select("admin_role, display_name")
        .eq("id", user.id)
        .maybeSingle();

    if (!adminUser) redirect("/dashboard");

    // Fetch assigned students
    const { data: assignments } = await supabase
        .from("mentor_assignments")
        .select("user_id, profiles!mentor_assignments_user_id_fkey(full_name, email)")
        .eq("mentor_id", user.id);

    const students = (assignments || []).map((a: any) => ({
        id: a.user_id,
        name: a.profiles?.full_name || a.profiles?.email || a.user_id.slice(0, 8),
    }));

    // Fetch all human conversations for assigned students
    const studentIds = students.map((s: any) => s.id);
    let conversations: any[] = [];
    let messages: any[] = [];
    let activeConvId: string | null = null;

    if (studentIds.length > 0) {
        const { data: convs } = await supabase
            .from("chat_conversations")
            .select("id, user_id, title, created_at")
            .in("user_id", studentIds)
            .eq("is_ai", false)
            .order("created_at", { ascending: false });

        conversations = convs || [];

        if (conversations.length > 0) {
            activeConvId = conversations[0].id;
            const { data: msgs } = await supabase
                .from("chat_messages")
                .select("id, sender_id, sender_role, content, created_at")
                .eq("conversation_id", activeConvId)
                .order("created_at", { ascending: true });
            messages = msgs || [];
        }
    }

    return (
        <AdminShell role={adminUser.admin_role}>
            <MentorChatPanel
                mentorId={user.id}
                students={students}
                conversations={conversations}
                initialMessages={messages}
                initialConversationId={activeConvId}
            />
        </AdminShell>
    );
}
