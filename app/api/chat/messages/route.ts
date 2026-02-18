import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

    // Verify access
    const { data: conv } = await supabase
        .from("chat_conversations")
        .select("user_id")
        .eq("id", conversationId)
        .maybeSingle();

    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Allow access if: user owns the conversation, or is a mentor assigned to that student
    if (conv.user_id !== user.id) {
        const { data: assignment } = await supabase
            .from("mentor_assignments")
            .select("id")
            .eq("mentor_id", user.id)
            .eq("user_id", conv.user_id)
            .maybeSingle();
        if (!assignment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: messages } = await supabase
        .from("chat_messages")
        .select("id, sender_id, sender_role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    return NextResponse.json({ messages: messages || [] });
}
