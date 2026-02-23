import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/chat/mentor-send
 * Sends a message in a human mentor-student conversation.
 * Body: { message, conversationId?, targetUserId? }
 */
export async function POST(req: Request) {
    const supabase = createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const { message, conversationId, targetUserId } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
        return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    if (message.length > 2000) {
        return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const { data: adminUser } = await supabase
        .from("admin_users")
        .select("admin_role")
        .eq("id", user.id)
        .maybeSingle();

    const isMentor = adminUser?.admin_role === "mentor";
    let convId = conversationId;

    if (!convId) {
        const studentId = isMentor ? targetUserId : user.id;
        if (!studentId) return NextResponse.json({ error: "Target user required" }, { status: 400 });

        const { data: existingConv } = await supabase
            .from("chat_conversations")
            .select("id")
            .eq("user_id", studentId)
            .eq("is_ai", false)
            .maybeSingle();

        if (existingConv) {
            convId = existingConv.id;
        } else if (!isMentor) {
            const { data: newConv, error: createErr } = await supabase
                .from("chat_conversations")
                .insert({ user_id: user.id, is_ai: false, title: "Mentor Chat" })
                .select("id")
                .single();
            if (createErr) {
                return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
            }
            convId = newConv.id;
        } else {
            return NextResponse.json({
                error: "Student hasn't opened their chat page yet. Ask them to visit the Mentor chat section first.",
                code: "NO_CONVERSATION"
            }, { status: 404 });
        }
    }

    const { data: conv } = await supabase
        .from("chat_conversations")
        .select("user_id, mentor_id")
        .eq("id", convId)
        .maybeSingle();

    if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    if (isMentor) {
        const { data: assignment } = await supabase
            .from("mentor_assignments")
            .select("id")
            .eq("mentor_id", user.id)
            .eq("user_id", conv.user_id)
            .maybeSingle();
        if (!assignment) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

        if (!conv.mentor_id) {
            await admin
                .from("chat_conversations")
                .update({ mentor_id: user.id })
                .eq("id", convId)
                .is("mentor_id", null);
        }
    } else if (conv.user_id !== user.id) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error: msgErr } = await admin.from("chat_messages").insert({
        conversation_id: convId,
        sender_id: user.id,
        sender_role: isMentor ? "mentor" : "user",
        content: message.trim(),
    });

    if (msgErr) {
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    return NextResponse.json({ conversationId: convId, sent: true });
}
