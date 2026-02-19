import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/chat/clear
 * Initiates or accepts a clear-chat request for a mentor-student conversation.
 * Body: { conversationId, action: "request" | "accept" | "reject" }
 * 
 * - "request": sender creates a clear request (adds metadata row)
 * - "accept": other side accepts, all messages in conversation are deleted
 * - "reject": other side rejects, clear request is removed
 */
export async function POST(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { conversationId, action } = await req.json();
    if (!conversationId || !action) return NextResponse.json({ error: "conversationId and action required" }, { status: 400 });

    // Verify access to conversation
    const { data: conv } = await supabase
        .from("chat_conversations")
        .select("user_id, clear_requested_by")
        .eq("id", conversationId)
        .eq("is_ai", false)
        .maybeSingle();

    if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    // Check authorization
    const isStudent = conv.user_id === user.id;
    let isMentor = false;
    if (!isStudent) {
        const { data: assignment } = await supabase
            .from("mentor_assignments")
            .select("id")
            .eq("mentor_id", user.id)
            .eq("user_id", conv.user_id)
            .maybeSingle();
        if (!assignment) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        isMentor = true;
    }

    if (action === "request") {
        // Set clear_requested_by to current user's id
        await supabase
            .from("chat_conversations")
            .update({ clear_requested_by: user.id })
            .eq("id", conversationId);
        return NextResponse.json({ status: "requested" });
    }

    if (action === "accept") {
        // Only the OTHER person can accept
        if (conv.clear_requested_by === user.id) {
            return NextResponse.json({ error: "You cannot accept your own request" }, { status: 400 });
        }
        if (!conv.clear_requested_by) {
            return NextResponse.json({ error: "No clear request pending" }, { status: 400 });
        }
        // Delete all messages
        await supabase.from("chat_messages").delete().eq("conversation_id", conversationId);
        // Clear the request flag
        await supabase.from("chat_conversations").update({ clear_requested_by: null }).eq("id", conversationId);
        return NextResponse.json({ status: "cleared" });
    }

    if (action === "reject") {
        // Clear the request flag
        await supabase.from("chat_conversations").update({ clear_requested_by: null }).eq("id", conversationId);
        return NextResponse.json({ status: "rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

/**
 * GET /api/chat/clear?conversationId=xxx
 * Check if there's a pending clear request
 */
export async function GET(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

    const { data: conv } = await supabase
        .from("chat_conversations")
        .select("clear_requested_by")
        .eq("id", conversationId)
        .maybeSingle();

    if (!conv) return NextResponse.json({ clearPending: false, requestedByMe: false });

    return NextResponse.json({
        clearPending: !!conv.clear_requested_by,
        requestedByMe: conv.clear_requested_by === user.id,
        requestedBy: conv.clear_requested_by,
    });
}
