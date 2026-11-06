import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { mentorRequestMode } from "@/lib/auth/staff";
import { sameOrigin } from "@/lib/demo/server";

const input = z.object({message: z.string().trim().min(1).max(2000), conversationId: z.string().uuid().nullish(), targetUserId: z.string().uuid().optional()}).strict();

type ConversationRow = {
    id: string;
    user_id: string;
    mentor_id: string | null;
    is_ai: boolean;
};

async function getFirstHumanConversation(
    supabase: Awaited<ReturnType<typeof createClient>>,
    studentId: string,
    mentorId?: string | null,
) {
    let query = supabase
        .from("chat_conversations")
        .select("id, user_id, mentor_id, is_ai")
        .eq("user_id", studentId)
        .eq("is_ai", false)
        .order("created_at", { ascending: true })
        .limit(1);

    if (mentorId) {
        query = query.eq("mentor_id", mentorId);
    } else if (mentorId === null) {
        query = query.is("mentor_id", null);
    }

    const { data } = await query;
    return (data?.[0] as ConversationRow | undefined) ?? null;
}

/**
 * POST /api/chat/mentor-send
 * Sends a message in a human mentor-student conversation.
 * Body: { message, conversationId?, targetUserId? }
 */
export async function POST(req: Request) {
    if (!sameOrigin(req)) return NextResponse.json({error: "Invalid origin"}, {status: 403});
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const parsed = input.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({error: "Check the message and conversation details."}, {status: 400});
    const {message, conversationId, targetUserId} = parsed.data;

    const { data: adminRows, error: staffError } = await supabase
        .from("admin_users")
        .select("admin_role")
        .eq("id", user.id)
        .limit(1);

    const adminUser = adminRows?.[0];
    if (staffError) return NextResponse.json({error: "Could not verify account access."}, {status: 503});
    const mode = mentorRequestMode(adminUser?.admin_role, targetUserId);
    if (mode === "forbidden") return NextResponse.json({error: "Not authorized"}, {status: 403});
    if (mode === "missing-target") return NextResponse.json({error: "Target user required"}, {status: 400});
    const isMentor = mode === "mentor";
    let convId = conversationId;
    const studentId = isMentor ? targetUserId : user.id;

    if (!studentId) {
        return NextResponse.json({ error: "Target user required" }, { status: 400 });
    }

    let assignedMentorId: string | null = null;

    if (isMentor) {
        const { data: assignmentRows } = await supabase
            .from("mentor_assignments")
            .select("id")
            .eq("mentor_id", user.id)
            .eq("user_id", studentId)
            .limit(1);

        if (!assignmentRows?.[0]) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        assignedMentorId = user.id;
    } else {
        const { data: assignmentRows } = await supabase
            .from("mentor_assignments")
            .select("mentor_id")
            .eq("user_id", user.id)
            .order("assigned_at", { ascending: false })
            .limit(1);

        assignedMentorId = assignmentRows?.[0]?.mentor_id ?? null;
    }

    let conversation: ConversationRow | null = null;

    if (convId) {
        const { data: conversationRows } = await supabase
            .from("chat_conversations")
            .select("id, user_id, mentor_id, is_ai")
            .eq("id", convId)
            .limit(1);

        conversation = (conversationRows?.[0] as ConversationRow | undefined) ?? null;
        if (!conversation) return NextResponse.json({error: "Conversation not found"}, {status: 404});
    }

    if (conversation?.is_ai) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (isMentor) {
        if (conversation) {
            if (conversation.user_id !== studentId) {
                return NextResponse.json({ error: "Not authorized" }, { status: 403 });
            }

            if (conversation.mentor_id && conversation.mentor_id !== user.id) {
                return NextResponse.json({ error: "Conversation belongs to a different mentor" }, { status: 403 });
            }
        } else {
            conversation = await getFirstHumanConversation(supabase, studentId, user.id);

            if (!conversation) {
                conversation = await getFirstHumanConversation(supabase, studentId, null);
            }
        }
    } else {
        if (conversation) {
            if (conversation.user_id !== user.id) {
                return NextResponse.json({ error: "Not authorized" }, { status: 403 });
            }

            if (assignedMentorId && conversation.mentor_id && conversation.mentor_id !== assignedMentorId) {
                conversation = await getFirstHumanConversation(supabase, studentId, assignedMentorId);
            }
        } else {
            if (assignedMentorId) {
                conversation = await getFirstHumanConversation(supabase, studentId, assignedMentorId);
            }

            if (!conversation) {
                conversation = await getFirstHumanConversation(supabase, studentId, null);
            }
        }
    }

    if (!conversation) {
        const { data: newConversation, error: createError } = await supabase
            .from("chat_conversations")
            .insert({
                user_id: studentId,
                mentor_id: assignedMentorId,
                is_ai: false,
                title: "Mentor Chat",
            })
            .select("id, user_id, mentor_id, is_ai")
            .single();

        if (createError) {
            const errorMessage = isMentor
                ? "Failed to create a mentor conversation. Apply the chat policy update in supabase/actualused/used.sql and try again."
                : "Failed to create conversation";

            return NextResponse.json({ error: errorMessage }, { status: createError.code === "42501" ? 403 : 500 });
        }

        conversation = newConversation as ConversationRow;
        convId = newConversation.id;
    }

    if (!conversation || conversation.is_ai) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (!isMentor && conversation.user_id !== user.id) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const desiredMentorId = isMentor ? user.id : assignedMentorId;
    if (desiredMentorId && !conversation.mentor_id) {
        const { error: attachError } = await supabase
            .from("chat_conversations")
            .update({ mentor_id: desiredMentorId })
            .eq("id", conversation.id);

        if (!attachError) {
            conversation.mentor_id = desiredMentorId;
        }
    }

    const { error: msgErr } = await supabase.from("chat_messages").insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_role: isMentor ? "mentor" : "user",
        content: message.trim(),
    });

    if (msgErr) {
        return NextResponse.json({ error: "Failed to send message" }, { status: msgErr.code === "42501" ? 403 : 500 });
    }

    return NextResponse.json({ conversationId: conversation.id, sent: true });
}
