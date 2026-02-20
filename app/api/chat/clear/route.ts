import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getConversationIfAuthorized(supabase: ReturnType<typeof createClient>, conversationId: string, userId: string) {
    const { data: conv } = await supabase
        .from("chat_conversations")
        .select("id, user_id, clear_requested_by")
        .eq("id", conversationId)
        .eq("is_ai", false)
        .maybeSingle();

    if (!conv) return { conv: null, isMentor: false };

    const isStudent = conv.user_id === userId;
    if (isStudent) return { conv, isMentor: false };

    const { data: assignment } = await supabase
        .from("mentor_assignments")
        .select("id")
        .eq("mentor_id", userId)
        .eq("user_id", conv.user_id)
        .maybeSingle();

    if (!assignment) return { conv: null, isMentor: false };

    return { conv, isMentor: true };
}

export async function POST(req: Request) {
    const supabase = createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { conversationId, action } = await req.json();
    if (!conversationId || !action) return NextResponse.json({ error: "conversationId and action required" }, { status: 400 });

    const { conv } = await getConversationIfAuthorized(supabase, conversationId, user.id);
    if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    if (action === "request") {
        const { error } = await admin
            .from("chat_conversations")
            .update({ clear_requested_by: user.id })
            .eq("id", conversationId);
        if (error) return NextResponse.json({ error: "Failed to request clear" }, { status: 500 });
        return NextResponse.json({ status: "requested" });
    }

    if (action === "accept") {
        if (conv.clear_requested_by === user.id) {
            return NextResponse.json({ error: "You cannot accept your own request" }, { status: 400 });
        }
        if (!conv.clear_requested_by) {
            return NextResponse.json({ error: "No clear request pending" }, { status: 400 });
        }

        const { error: deleteErr } = await admin.from("chat_messages").delete().eq("conversation_id", conversationId);
        if (deleteErr) return NextResponse.json({ error: "Failed to clear chat" }, { status: 500 });

        const { error: clearErr } = await admin
            .from("chat_conversations")
            .update({ clear_requested_by: null })
            .eq("id", conversationId);
        if (clearErr) return NextResponse.json({ error: "Failed to clear request" }, { status: 500 });

        return NextResponse.json({ status: "cleared" });
    }

    if (action === "reject") {
        const { error } = await admin
            .from("chat_conversations")
            .update({ clear_requested_by: null })
            .eq("id", conversationId);
        if (error) return NextResponse.json({ error: "Failed to reject request" }, { status: 500 });
        return NextResponse.json({ status: "rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

    const { conv } = await getConversationIfAuthorized(supabase, conversationId, user.id);
    if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    return NextResponse.json({
        clearPending: !!conv.clear_requested_by,
        requestedByMe: conv.clear_requested_by === user.id,
        requestedBy: conv.clear_requested_by,
    });
}
