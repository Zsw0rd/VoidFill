import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data: assignmentRows } = await supabase
        .from("mentor_assignments")
        .select("mentor_id")
        .eq("user_id", user.id)
        .order("assigned_at", { ascending: false })
        .limit(1);

    const mentorId = assignmentRows?.[0]?.mentor_id ?? null;
    if (!mentorId) {
        return NextResponse.json({ conversationId: null, mentorId: null });
    }

    const { data: mentorConversations } = await supabase
        .from("chat_conversations")
        .select("id, mentor_id")
        .eq("user_id", user.id)
        .eq("is_ai", false)
        .eq("mentor_id", mentorId)
        .order("created_at", { ascending: true })
        .limit(1);

    let conversation = mentorConversations?.[0] ?? null;

    if (!conversation) {
        const { data: conversations } = await supabase
            .from("chat_conversations")
            .select("id, mentor_id")
            .eq("user_id", user.id)
            .eq("is_ai", false)
            .order("created_at", { ascending: true })
            .limit(1);

        conversation = conversations?.[0] ?? null;
    }

    if (conversation && !conversation.mentor_id) {
        const { error } = await supabase
            .from("chat_conversations")
            .update({ mentor_id: mentorId })
            .eq("id", conversation.id);

        if (!error) {
            conversation.mentor_id = mentorId;
        }
    }

    return NextResponse.json({
        conversationId: conversation?.id ?? null,
        mentorId,
    });
}
