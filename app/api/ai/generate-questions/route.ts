import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractGeminiText, parseJsonArray, geminiUrl } from "@/lib/gemini";

export async function POST() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured. Add your key to .env.local" }, { status: 500 });

    // Fetch user data for context-aware question generation
    const [profileRes, scoresRes, attemptsRes] = await Promise.all([
        supabase.from("profiles").select("*, roles(name)").eq("id", user.id).maybeSingle(),
        supabase.from("user_skill_scores").select("score, skill_id, skills(name, category)").eq("user_id", user.id),
        supabase.from("daily_attempts").select("correct_count, total_count, difficulty_level").eq("user_id", user.id).order("attempt_date", { ascending: false }).limit(5),
    ]);

    const profile = profileRes.data;
    const scores = scoresRes.data || [];
    const recentAttempts = attemptsRes.data || [];

    // Calculate adaptive difficulty (1-5)
    let difficulty = 1;
    if (recentAttempts.length > 0) {
        const avgPct = recentAttempts.reduce((sum: number, a: any) => {
            return sum + (a.total_count > 0 ? (a.correct_count / a.total_count) * 100 : 0);
        }, 0) / recentAttempts.length;
        const prevDiff = Math.max(...recentAttempts.map((a: any) => a.difficulty_level || 1));
        if (avgPct >= 80) difficulty = Math.min(prevDiff + 1, 5);
        else if (avgPct <= 40) difficulty = Math.max(prevDiff - 1, 1);
        else difficulty = prevDiff;
    }

    const difficultyLabel = ["", "Easy", "Medium", "Intermediate", "Hard", "Expert"][difficulty];

    // Build skill context — focus more questions on weak areas
    const skillSummary = scores.map((s: any) => ({
        name: s.skills?.name || "Unknown",
        category: s.skills?.category || "General",
        score: s.score,
    }));

    const weakSkills = skillSummary.filter((s: any) => s.score < 50).map((s: any) => s.name);
    const moderateSkills = skillSummary.filter((s: any) => s.score >= 50 && s.score < 75).map((s: any) => s.name);
    const strongSkills = skillSummary.filter((s: any) => s.score >= 75).map((s: any) => s.name);

    const roleName = (profile as any)?.roles?.name || "Software Developer";

    const prompt = `You are a skill assessment question generator for an EdTech platform. Generate exactly 10 multiple-choice questions for a ${profile?.user_type || "student"} targeting a "${roleName}" role.

DIFFICULTY LEVEL: ${difficultyLabel} (${difficulty}/5)

USER CONTEXT:
- Current skills: ${profile?.current_skills_text || "Not specified"}
- Weak areas (focus MORE questions here): ${weakSkills.join(", ") || "None identified yet"}
- Moderate areas: ${moderateSkills.join(", ") || "None"}
- Strong areas (fewer questions, but make them harder): ${strongSkills.join(", ") || "None"}

RULES:
1. Generate 10 questions total
2. ${weakSkills.length > 0 ? `At least 4-5 questions should target weak skills: ${weakSkills.join(", ")}` : "Distribute evenly across role-relevant skills"}
3. Difficulty ${difficultyLabel}: ${difficulty <= 2 ? "Focus on fundamentals, definitions, basic concepts" : difficulty <= 3 ? "Include applied scenarios, code snippets, comparisons" : "Complex problem-solving, edge cases, architecture decisions, optimization"}
4. Each question must have exactly 4 options with exactly 1 correct answer
5. Include a brief explanation for each correct answer
6. Make questions relevant to real-world ${roleName} work

Return ONLY valid JSON array (no markdown):
[
  {
    "prompt": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "difficulty": ${difficulty},
    "skill_name": "Skill this tests",
    "explanation": "Brief explanation of why the correct answer is right"
  }
]`;

    try {
        const geminiRes = await fetch(geminiUrl(apiKey), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 4096,
                    responseMimeType: "application/json",
                },
            }),
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error("Gemini API error:", errText);
            return NextResponse.json({ error: "AI question generation failed" }, { status: 502 });
        }

        const geminiData = await geminiRes.json();
        // Use extractGeminiText to skip 2.5 Flash thinking blocks
        const rawText = extractGeminiText(geminiData);
        const questions = parseJsonArray(rawText);

        if (questions.length === 0) {
            console.error("No questions parsed. Raw preview:", rawText.slice(0, 300));
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        // Ensure we have exactly the right format
        const formatted = (Array.isArray(questions) ? questions : []).slice(0, 10).map((q: any, i: number) => ({
            id: `ai_${Date.now()}_${i}`,
            prompt: q.prompt || `Question ${i + 1}`,
            options: Array.isArray(q.options) ? q.options.slice(0, 4) : ["A", "B", "C", "D"],
            correct_index: typeof q.correct_index === "number" ? q.correct_index : 0,
            difficulty: q.difficulty || difficulty,
            skill_name: q.skill_name || "General",
            explanation: q.explanation || "",
        }));

        return NextResponse.json({
            questions: formatted,
            difficulty,
            difficultyLabel,
        });
    } catch (err: any) {
        console.error("AI question gen error:", err);
        return NextResponse.json({ error: "AI question generation failed", message: err.message }, { status: 500 });
    }
}
