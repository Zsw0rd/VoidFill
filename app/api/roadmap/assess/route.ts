import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractGeminiText, parseJsonArray, geminiUrl } from "@/lib/gemini";

export async function POST(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

    const body = await req.json();
    const { course_title, skill_name, is_skill_assessment } = body;

    if (!course_title) {
        return NextResponse.json({ error: "course_title required" }, { status: 400 });
    }

    const questionCount = is_skill_assessment ? 8 : 5;
    const prompt = is_skill_assessment
        ? `Generate a ${questionCount}-question skill assessment quiz.

Skill: "${skill_name || "General"}"
Context: ${course_title}

Test the learner's understanding of this skill area comprehensively. Questions should cover fundamentals, application, and problem-solving.

Return ONLY valid JSON array:
[
  {
    "prompt": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Brief explanation"
  }
]`
        : `Generate a ${questionCount}-question assessment quiz for the following course/topic.

Course: "${course_title}"
Skill Area: "${skill_name || "General"}"

Test whether the learner has understood this course material. Range from recall to application.

Return ONLY valid JSON array:
[
  {
    "prompt": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Brief explanation"
  }
]`;

    try {
        const geminiRes = await fetch(geminiUrl(apiKey), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 4096, responseMimeType: "application/json" },
            }),
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error("Gemini assess error:", errText);
            return NextResponse.json({ error: "Assessment generation failed" }, { status: 502 });
        }

        const geminiData = await geminiRes.json();
        // Use extractGeminiText to skip 2.5 Flash thinking blocks
        const rawText = extractGeminiText(geminiData);
        const questions = parseJsonArray(rawText);

        if (questions.length === 0) {
            console.error("Failed to parse assessment. Raw:", rawText.slice(0, 500));
            return NextResponse.json({ error: "Failed to parse AI assessment response" }, { status: 500 });
        }

        return NextResponse.json({
            questions: questions.slice(0, questionCount).map((q: any, i: number) => ({
                id: `assess_${Date.now()}_${i}`,
                prompt: q.prompt || `Question ${i + 1}`,
                options: q.options?.slice(0, 4) || ["A", "B", "C", "D"],
                correct_index: typeof q.correct_index === "number" ? q.correct_index : 0,
                explanation: q.explanation || "",
            })),
        });
    } catch (err: any) {
        console.error("Assessment gen error:", err);
        return NextResponse.json({ error: "Assessment generation failed", detail: err.message }, { status: 500 });
    }
}
