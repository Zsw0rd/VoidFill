import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { MentorChatUI } from "./ui";

export default async function MentorChatPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    // Fetch existing AI conversations
    const { data: conversations } = await supabase
        .from("chat_conversations")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .eq("is_ai", true)
        .order("created_at", { ascending: false })
        .limit(10);

    // Fetch messages for the most recent conversation
    let messages: any[] = [];
    let activeConvId: string | null = null;

    if (conversations && conversations.length > 0) {
        activeConvId = conversations[0].id;
        const { data: msgs } = await supabase
            .from("chat_messages")
            .select("id, sender_role, content, created_at")
            .eq("conversation_id", activeConvId)
            .order("created_at", { ascending: true });
        messages = msgs || [];
    }

    return (
        <AppShell>
            <MentorChatUI
                initialMessages={messages}
                initialConversationId={activeConvId}
                conversations={conversations || []}
            />
        </AppShell>
    );
}
