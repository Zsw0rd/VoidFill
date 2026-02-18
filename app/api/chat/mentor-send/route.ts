import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = createClient();
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

    // Determine if sender is mentor or student
    const { data: adminUser } = await supabase
        .from("admin_users")
        .select("admin_role")
        .eq("id", user.id)
        .maybeSingle();

    const isMentor = adminUser?.admin_role === "mentor";

    let convId = conversationId;

    if (!convId) {
        // Creating a new human conversation
        const studentId = isMentor ? targetUserId : user.id;
        if (!studentId) return NextResponse.json({ error: "Target user required" }, { status: 400 });

        // Verify mentor-student assignment
        if (isMentor) {
            const { data: assignment } = await supabase
                .from("mentor_assignments")
                .select("id")
                .eq("mentor_id", user.id)
                .eq("user_id", studentId)
                .maybeSingle();
            if (!assignment) return NextResponse.json({ error: "Student not assigned to you" }, { status: 403 });
        } else {
            // Student starting chat — verify they have a mentor
            const { data: assignment } = await supabase
                .from("mentor_assignments")
                .select("mentor_id")
                .eq("user_id", user.id)
                .maybeSingle();
            if (!assignment) return NextResponse.json({ error: "No mentor assigned" }, { status: 403 });
        }

        // Check for existing conversation between this student and mentor
        const mentorId = isMentor ? user.id : null;
        const sId = isMentor ? targetUserId : user.id;

        // Find existing human conv for this student
        const { data: existingConv } = await supabase
            .from("chat_conversations")
            .select("id")
            .eq("user_id", sId)
            .eq("is_ai", false)
            .maybeSingle();

        if (existingConv) {
            convId = existingConv.id;
        } else {
            const { data: conv, error: convErr } = await supabase
                .from("chat_conversations")
                .insert({ user_id: sId, is_ai: false, title: "Mentor Chat" })
                .select("id")
                .single();
            if (convErr) return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
            convId = conv.id;
        }
    }

    // Verify access: mentor must be assigned to the student, or student owns the conversation
    const { data: conv } = await supabase
        .from("chat_conversations")
        .select("user_id")
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
    } else {
        if (conv.user_id !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Save message
    await supabase.from("chat_messages").insert({
        conversation_id: convId,
        sender_id: user.id,
        sender_role: isMentor ? "mentor" : "user",
        content: message.trim(),
    });

    return NextResponse.json({ conversationId: convId, sent: true });
}
