import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/chat/mentor-conversations?studentId=xxx
 * Returns the human (non-AI) conversation ID between the logged-in mentor and the student.
 * Allows mentors to discover conversations that students initiated.
 */
export async function GET(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

    // Verify caller is a mentor assigned to this student
    const { data: assignmentRows } = await supabase
        .from("mentor_assignments")
        .select("id")
        .eq("mentor_id", user.id)
        .eq("user_id", studentId)
        .limit(1);

    const assignment = assignmentRows?.[0];
    if (!assignment) return NextResponse.json({ error: "Not assigned to this student" }, { status: 403 });

    // Prefer the conversation already linked to this mentor.
    const { data: mentorConversations } = await supabase
        .from("chat_conversations")
        .select("id, mentor_id")
        .eq("user_id", studentId)
        .eq("is_ai", false)
        .eq("mentor_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);

    let conv = mentorConversations?.[0] ?? null;

    if (!conv) {
        const { data: conversations } = await supabase
            .from("chat_conversations")
            .select("id, mentor_id")
            .eq("user_id", studentId)
            .eq("is_ai", false)
            .order("created_at", { ascending: true })
            .limit(1);

        conv = conversations?.[0] ?? null;
    }

    if (conv && !conv.mentor_id) {
        await supabase
            .from("chat_conversations")
            .update({ mentor_id: user.id })
            .eq("id", conv.id);
    }

    return NextResponse.json({ conversationId: conv?.id || null });
}
