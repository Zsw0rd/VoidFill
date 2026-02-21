import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { MentorChatUI } from "./ui";

export default async function MentorChatPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    // Fetch existing AI conversations
    const { data: aiConversations } = await supabase
        .from("chat_conversations")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .eq("is_ai", true)
        .order("created_at", { ascending: false })
        .limit(10);

    // Fetch AI messages for the most recent conversation
    let aiMessages: any[] = [];
    let aiConvId: string | null = null;

    if (aiConversations && aiConversations.length > 0) {
        aiConvId = aiConversations[0].id;
        const { data: msgs } = await supabase
            .from("chat_messages")
            .select("id, sender_role, content, created_at")
            .eq("conversation_id", aiConvId)
            .order("created_at", { ascending: true });
        aiMessages = msgs || [];
    }

    // Check if user has a mentor assigned
    const { data: assignment } = await supabase
        .from("mentor_assignments")
        .select("mentor_id, admin_users!mentor_assignments_mentor_id_fkey(display_name)")
        .eq("user_id", user.id)
        .maybeSingle();

    let mentorInfo: { id: string; name: string } | null = null;
    let humanMessages: any[] = [];
    let humanConvId: string | null = null;

    if (assignment) {
        mentorInfo = {
            id: assignment.mentor_id,
            name: (assignment as any).admin_users?.display_name || "Your Mentor",
        };

        // Look for existing human conversation
        const { data: humanConv } = await supabase
            .from("chat_conversations")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_ai", false)
            .maybeSingle();

        if (humanConv) {
            humanConvId = humanConv.id;
        } else {
            // Auto-create conversation so mentor always has one to discover
            // This runs under the student's auth context, so RLS allows it
            const { data: newConv } = await supabase
                .from("chat_conversations")
                .insert({ user_id: user.id, is_ai: false, title: "Mentor Chat" })
                .select("id")
                .single();
            if (newConv) humanConvId = newConv.id;
        }

        if (humanConvId) {
            const { data: msgs } = await supabase
                .from("chat_messages")
                .select("id, sender_id, sender_role, content, created_at")
                .eq("conversation_id", humanConvId)
                .order("created_at", { ascending: true });
            humanMessages = msgs || [];
        }
    }

    return (
        <AppShell>
            <MentorChatUI
                initialAiMessages={aiMessages}
                initialAiConversationId={aiConvId}
                mentorInfo={mentorInfo}
                initialHumanMessages={humanMessages}
                initialHumanConversationId={humanConvId}
            />
        </AppShell>
    );
}
