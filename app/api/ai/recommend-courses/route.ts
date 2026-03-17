import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractGeminiText, parseJsonArray, geminiUrl } from "@/lib/gemini";

export async function POST(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

    // Get user profile for context
    const { data: profile } = await supabase.from("profiles").select("*, roles(name)").eq("id", user.id).maybeSingle();
    const { data: scores } = await supabase.from("user_skill_scores").select("score, skills(name, category)").eq("user_id", user.id);

    // Fetch ALL skills from DB so we can tell Gemini the exact names
    const { data: allSkills } = await supabase.from("skills").select("id, name");

    const roleName = (profile as any)?.roles?.name || "Software Developer";
    const skillScores = (scores || []).map((s: any) => ({
        name: s.skills?.name || "Unknown",
        category: s.skills?.category || "General",
        score: s.score,
    }));

    // Get all role skills — we want resources for ALL of them, not just weak ones
    const { data: roleSkillRows } = await supabase
        .from("role_skills")
        .select("skill_id, weight, skills(name)")
        .eq("role_id", profile.target_role_id);

    const roleSkillNames = (roleSkillRows || []).map((rs: any) => rs.skills?.name).filter(Boolean);

    const prompt = `You are an expert career advisor and course recommender for the "${roleName}" role.

USER PROFILE:
- Type: ${profile?.user_type || "student"}
- Current Skills: ${profile?.current_skills_text || "Not specified"}
${profile?.user_type === "professional" ? `- Company: ${profile?.company || "N/A"}\n- Title: ${profile?.job_title || "N/A"}\n- Experience: ${profile?.years_experience || 0} years` : `- Education: ${profile?.education_level || "N/A"}\n- Course: ${profile?.course || "N/A"}`}

SKILL SCORES:
${skillScores.map((s: any) => `- ${s.name} (${s.category}): ${s.score}/100`).join("\n")}

CRITICAL: The "skill_name" field in your response MUST exactly match one of these names from our database:
${(allSkills || []).map((s: any) => s.name).join(", ")}

Do NOT use any other skill names. Only use the exact names listed above.

You MUST generate 3-5 recommended resources for EACH of these skills:
${roleSkillNames.join(", ")}

Return ONLY valid JSON array with one entry per skill:
[
  {
    "skill_name": "EXACT skill name from list above",
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
- Generate resources for EVERY skill listed, not just weak ones
- Use REAL course/book URLs from actual platforms (Coursera, Udemy, freeCodeCamp, YouTube, Khan Academy, MIT OCW, etc.)
- Order resources from easiest to hardest within each skill
- For books, use Amazon or publisher URLs
- Include a mix of free and paid resources
- Tailor recommendations to the user's level (${profile?.user_type === "professional" ? "professional with experience" : "student/beginner"})`;

    try {
        const geminiRes = await fetch(geminiUrl(apiKey), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" },
            }),
        });

        if (!geminiRes.ok) {
            return NextResponse.json({ error: "AI recommendation failed" }, { status: 502 });
        }

        const geminiData = await geminiRes.json();
        // Use extractGeminiText to skip 2.5 Flash thinking blocks
        const rawText = extractGeminiText(geminiData);
        const recommendations = parseJsonArray(rawText);

        if (recommendations.length === 0) {
            console.error("No recommendations parsed. Raw preview:", rawText.slice(0, 300));
            return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 });
        }

        // Save to roadmap_courses table with fuzzy skill matching
        const dbSkills = (allSkills || []).map((s: any) => ({ id: s.id, name: s.name, lower: s.name.toLowerCase().trim() }));

        function findSkillId(aiName: string): string | undefined {
            const lower = aiName.toLowerCase().trim();
            // 1. Exact case-insensitive
            const exact = dbSkills.find(s => s.lower === lower);
            if (exact) return exact.id;
            // 2. Substring match
            const partial = dbSkills.find(s => s.lower.includes(lower) || lower.includes(s.lower));
            if (partial) return partial.id;
            // 3. Word overlap
            const words = lower.split(/[\s.\-_/]+/).filter(w => w.length > 2);
            const wordMatch = dbSkills.find(s => {
                const dbWords = s.lower.split(/[\s.\-_/]+/).filter((w: string) => w.length > 2);
                return words.some(w => dbWords.some((dw: string) => dw.includes(w) || w.includes(dw)));
            });
            if (wordMatch) return wordMatch.id;
            return undefined;
        }

        // Build replacement rows before touching existing recommendations.
        const coursesToInsert: any[] = [];
        const unmatchedSkills: string[] = [];

        for (const rec of recommendations) {
            const aiSkillName = rec.skill_name || rec.skillName || "";
            const skillId = findSkillId(aiSkillName);

            if (!skillId) {
                unmatchedSkills.push(aiSkillName);
                continue;
            }

            for (let i = 0; i < (rec.resources || []).length; i++) {
                const r = rec.resources[i];
                coursesToInsert.push({
                    user_id: user.id,
                    skill_id: skillId,
                    title: r.title || "Untitled",
                    type: ["course", "book", "project", "tutorial", "practice"].includes(r.type) ? r.type : "course",
                    provider: r.provider || "",
                    url: r.url || "",
                    estimated_hours: typeof r.estimated_hours === "number" ? r.estimated_hours : null,
                    difficulty: ["beginner", "intermediate", "advanced"].includes(r.difficulty) ? r.difficulty : "intermediate",
                    description: r.description || "",
                    sort_order: i,
                });
            }
        }

        if (unmatchedSkills.length > 0) {
            console.warn("Unmatched skill names from AI:", unmatchedSkills);
        }

        if (coursesToInsert.length === 0) {
            return NextResponse.json({
                saved: 0,
                unmatched: unmatchedSkills,
                message: "No matching skills found. Please take a daily test first.",
            });
        }

        const { data: existingCourses, error: existingErr } = await supabase
            .from("roadmap_courses")
            .select("skill_id, title, type, provider, url, estimated_hours, difficulty, description, sort_order, completed")
            .eq("user_id", user.id);

        if (existingErr) {
            console.error("Fetch existing recommendations error:", existingErr);
            return NextResponse.json({ error: "Failed to load existing recommendations" }, { status: 500 });
        }

        const { error: deleteErr } = await supabase.from("roadmap_courses").delete().eq("user_id", user.id);
        if (deleteErr) {
            console.error("Delete error:", deleteErr);
            return NextResponse.json({ error: "Failed to replace recommendations" }, { status: 500 });
        }

        const { error: insertErr } = await supabase.from("roadmap_courses").insert(coursesToInsert);
        if (insertErr) {
            console.error("Insert error:", insertErr);

            if (existingCourses && existingCourses.length > 0) {
                const restoreRows = existingCourses.map((course: any) => ({
                    user_id: user.id,
                    skill_id: course.skill_id,
                    title: course.title,
                    type: course.type,
                    provider: course.provider,
                    url: course.url,
                    estimated_hours: course.estimated_hours,
                    difficulty: course.difficulty,
                    description: course.description,
                    sort_order: course.sort_order,
                    completed: course.completed,
                }));

                const { error: restoreErr } = await supabase.from("roadmap_courses").insert(restoreRows);
                if (restoreErr) {
                    console.error("Restore error:", restoreErr);
                }
            }

            return NextResponse.json({ error: "Failed to save recommendations" }, { status: 500 });
        }

        return NextResponse.json({
            saved: coursesToInsert.length,
            unmatched: unmatchedSkills,
            message: `${coursesToInsert.length} resources saved.`,
        });
    } catch (err: any) {
        console.error("AI recommend error:", err);
        return NextResponse.json({ error: "AI recommendation failed", message: err.message }, { status: 500 });
    }
}
