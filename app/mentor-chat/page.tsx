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
    const { data: assignmentRows } = await supabase
        .from("mentor_assignments")
        .select("mentor_id, admin_users!mentor_assignments_mentor_id_fkey(display_name)")
        .eq("user_id", user.id)
        .order("assigned_at", { ascending: false })
        .limit(1);

    const assignment = assignmentRows?.[0] ?? null;

    let mentorInfo: { id: string; name: string } | null = null;
    let humanMessages: any[] = [];
    let humanConvId: string | null = null;

    if (assignment) {
        const mentorId = assignment.mentor_id;

        mentorInfo = {
            id: mentorId,
            name: (assignment as any).admin_users?.display_name || "Your Mentor",
        };

        // Prefer the conversation linked to this mentor so both sides read the same thread.
        const { data: humanConversations } = await supabase
            .from("chat_conversations")
            .select("id, mentor_id")
            .eq("user_id", user.id)
            .eq("is_ai", false)
            .eq("mentor_id", mentorId)
            .order("created_at", { ascending: true })
            .limit(1);

        let humanConv = humanConversations?.[0] ?? null;

        if (!humanConv) {
            const { data: fallbackConversations } = await supabase
                .from("chat_conversations")
                .select("id, mentor_id")
                .eq("user_id", user.id)
                .eq("is_ai", false)
                .order("created_at", { ascending: true })
                .limit(1);

            humanConv = fallbackConversations?.[0] ?? null;

            if (humanConv && !humanConv.mentor_id) {
                await supabase
                    .from("chat_conversations")
                    .update({ mentor_id: mentorId })
                    .eq("id", humanConv.id);
            }
        }

        if (humanConv) {
            humanConvId = humanConv.id;
        } else {
            // Auto-create the mentor-linked conversation so the mentor can see it immediately.
            const { data: newConv } = await supabase
                .from("chat_conversations")
                .insert({ user_id: user.id, mentor_id: mentorId, is_ai: false, title: "Mentor Chat" })
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
