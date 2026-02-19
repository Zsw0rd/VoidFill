import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

    const body = await req.json();
    const { course_id, course_title, skill_name } = body;
    if (!course_id || !course_title) {
        return NextResponse.json({ error: "course_id and course_title required" }, { status: 400 });
    }

    const prompt = `Generate a 5-question assessment quiz for the following course/topic.

Course: "${course_title}"
Skill Area: "${skill_name || "General"}"

The assessment should test whether the learner has completed and understood this course material. Questions should range from recall to application.

Return ONLY valid JSON array (no markdown):
[
  {
    "prompt": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Brief explanation of the correct answer"
  }
]`;

    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 2048, responseMimeType: "application/json" },
                }),
            },
        );

        if (!geminiRes.ok) {
            return NextResponse.json({ error: "Assessment generation failed" }, { status: 502 });
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

        let questions;
        try {
            questions = JSON.parse(rawText);
        } catch {
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        return NextResponse.json({
            course_id,
            questions: (Array.isArray(questions) ? questions : []).slice(0, 5).map((q: any, i: number) => ({
                id: `assess_${i}`,
                prompt: q.prompt || `Question ${i + 1}`,
                options: q.options?.slice(0, 4) || ["A", "B", "C", "D"],
                correct_index: q.correct_index ?? 0,
                explanation: q.explanation || "",
            })),
        });
    } catch (err: any) {
        return NextResponse.json({ error: "Assessment generation failed", message: err.message }, { status: 500 });
    }
}
