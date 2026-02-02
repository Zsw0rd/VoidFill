import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

    // Get user profile for context
    const { data: profile } = await supabase.from("profiles").select("*, roles(name)").eq("id", user.id).maybeSingle();
    const { data: scores } = await supabase.from("user_skill_scores").select("score, skills(name, category)").eq("user_id", user.id);

    const roleName = (profile as any)?.roles?.name || "Software Developer";
    const skillScores = (scores || []).map((s: any) => ({
        name: s.skills?.name || "Unknown",
        category: s.skills?.category || "General",
        score: s.score,
    }));

    const weakSkills = skillScores.filter((s: any) => s.score < 50);

    const prompt = `You are an expert career advisor and course recommender for the "${roleName}" role.

USER PROFILE:
- Type: ${profile?.user_type || "student"}
- Current Skills: ${profile?.current_skills_text || "Not specified"}
${profile?.user_type === "professional" ? `- Company: ${profile?.company || "N/A"}\n- Title: ${profile?.job_title || "N/A"}\n- Experience: ${profile?.years_experience || 0} years` : `- Education: ${profile?.education_level || "N/A"}\n- Course: ${profile?.course || "N/A"}`}

SKILL SCORES:
${skillScores.map((s: any) => `- ${s.name} (${s.category}): ${s.score}/100`).join("\n")}

WEAK AREAS (priority):
${weakSkills.map((s: any) => `- ${s.name}: ${s.score}/100`).join("\n") || "None identified"}

For each skill that needs improvement (score < 80), generate 3-5 recommended resources. Return ONLY valid JSON array:
[
  {
    "skill_name": "Skill name",
    "resources": [
      {
        "title": "Course/Book title",
        "type": "course|book|project|tutorial|practice",
        "provider": "Platform name (Coursera, Udemy, freeCodeCamp, YouTube, etc.)",
        "url": "Real URL to the resource (use actual URLs from real platforms)",
        "estimated_hours": 10,
        "difficulty": "beginner|intermediate|advanced",
        "description": "Brief 1-line description of what this covers"
      }
    ]
  }
]

IMPORTANT:
- Use REAL course/book URLs from actual platforms (Coursera, Udemy, freeCodeCamp, YouTube, Khan Academy, MIT OCW, etc.)
- Order resources from easiest to hardest within each skill
- For books, use Amazon or publisher URLs
- Include a mix of free and paid resources
- Tailor recommendations to the user's level (${profile?.user_type === "professional" ? "professional with experience" : "student/beginner"})`;

    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 4096, responseMimeType: "application/json" },
                }),
            },
        );

        if (!geminiRes.ok) {
            return NextResponse.json({ error: "AI recommendation failed" }, { status: 502 });
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

        let recommendations;
        try {
            recommendations = JSON.parse(rawText);
        } catch {
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        // Save to roadmap_courses table
        const { data: skills } = await supabase.from("skills").select("id, name");
        const skillMap = new Map((skills || []).map((s: any) => [s.name.toLowerCase(), s.id]));

        // Delete old recommendations
        await supabase.from("roadmap_courses").delete().eq("user_id", user.id);

        // Insert new ones
        const coursesToInsert: any[] = [];
        for (const rec of (Array.isArray(recommendations) ? recommendations : [])) {
            const skillId = skillMap.get(rec.skill_name?.toLowerCase());
            if (!skillId) continue;

            for (let i = 0; i < (rec.resources || []).length; i++) {
                const r = rec.resources[i];
                coursesToInsert.push({
                    user_id: user.id,
                    skill_id: skillId,
                    title: r.title,
                    type: r.type || "course",
                    provider: r.provider || "",
                    url: r.url || "",
                    estimated_hours: r.estimated_hours || null,
                    difficulty: r.difficulty || "intermediate",
                    description: r.description || "",
                    sort_order: i,
                });
            }
        }

        if (coursesToInsert.length > 0) {
            await supabase.from("roadmap_courses").insert(coursesToInsert);
        }

        return NextResponse.json({ recommendations, saved: coursesToInsert.length });
    } catch (err: any) {
        console.error("AI recommend error:", err);
        return NextResponse.json({ error: "AI recommendation failed", message: err.message }, { status: 500 });
    }
}
