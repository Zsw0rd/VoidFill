import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

    // Fetch all user data in parallel
    const [profileRes, scoresRes, roleSkillsRes] = await Promise.all([
        supabase.from("profiles").select("*, roles(name, description)").eq("id", user.id).maybeSingle(),
        supabase.from("user_skill_scores").select("score, skills(name, category)").eq("user_id", user.id),
        supabase
            .from("profiles")
            .select("target_role_id")
            .eq("id", user.id)
            .maybeSingle()
            .then(async (p) => {
                const roleId = p.data?.target_role_id;
                if (!roleId) return { data: [] };
                return supabase.from("role_skills").select("weight, skills(name, category)").eq("role_id", roleId);
            }),
    ]);

    const profile = profileRes.data;
    const userScores = scoresRes.data || [];
    const roleSkills = (roleSkillsRes as any).data || [];

    // Build context for Gemini
    const skillSummary = userScores.map((s: any) => ({
        skill: s.skills?.name || "Unknown",
        category: s.skills?.category || "General",
        score: s.score,
    }));

    const roleRequirements = roleSkills.map((rs: any) => ({
        skill: rs.skills?.name || "Unknown",
        category: rs.skills?.category || "General",
        weight: rs.weight,
        benchmarkScore: Math.round(Number(rs.weight) * 100),
    }));

    const gapAnalysis = roleRequirements.map((req: any) => {
        const userSkill = skillSummary.find((s: any) => s.skill === req.skill);
        const userScore = userSkill?.score ?? 0;
        const gap = Math.max(0, req.benchmarkScore - userScore);
        return { ...req, userScore, gap };
    });

    const prompt = `You are an AI-powered Skill Gap Analyzer for an EdTech platform. Analyze the following learner data and provide personalized, actionable recommendations.

## Learner Profile
- Name: ${profile?.full_name || "Learner"}
- Course: ${profile?.course || "Not specified"}
- Target Role: ${(profile as any)?.roles?.name || "Not selected"}
- Strengths (self-reported): ${profile?.strengths || "Not provided"}
- Weaknesses (self-reported): ${profile?.weaknesses || "Not provided"}
- Future Plans: ${profile?.future_plans || "Not provided"}

## Current Skill Scores (out of 100)
${skillSummary.map((s: any) => `- ${s.skill} (${s.category}): ${s.score}/100`).join("\n")}

## Target Role Requirements
${roleRequirements.map((r: any) => `- ${r.skill}: weight=${r.weight}, benchmark=${r.benchmarkScore}%`).join("\n")}

## Gap Analysis
${gapAnalysis.map((g: any) => `- ${g.skill}: user=${g.userScore}%, benchmark=${g.benchmarkScore}%, gap=${g.gap} points`).join("\n")}

Please provide your analysis in the following JSON format (return ONLY valid JSON, no markdown):
{
  "overallAssessment": "2-3 sentence summary of the learner's current position relative to their target role",
  "strengthAreas": ["list of skills they're doing well in"],
  "criticalGaps": [
    {
      "skill": "skill name",
      "currentScore": 0,
      "targetScore": 0,
      "gap": 0,
      "severity": "critical|moderate|minor",
      "recommendation": "specific actionable recommendation",
      "resources": [
        { "title": "Resource name", "type": "course|book|project|practice", "provider": "Platform name", "url": "URL if applicable", "estimatedHours": 0 }
      ]
    }
  ],
  "learningPath": [
    {
      "phase": 1,
      "title": "Phase title",
      "duration": "e.g. 2 weeks",
      "focus": "What to focus on",
      "milestones": ["milestone 1", "milestone 2"]
    }
  ],
  "motivationalTip": "A personalized encouraging message based on their profile"
}`;

    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 4096,
                        responseMimeType: "application/json",
                    },
                }),
            },
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error("Gemini API error:", errText);
            return NextResponse.json({ error: "Gemini API call failed", details: errText }, { status: 502 });
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        // Parse the JSON response
        let analysis;
        try {
            analysis = JSON.parse(rawText);
        } catch {
            analysis = { overallAssessment: rawText, strengthAreas: [], criticalGaps: [], learningPath: [], motivationalTip: "" };
        }

        return NextResponse.json({
            analysis,
            meta: {
                skillCount: skillSummary.length,
                gapCount: gapAnalysis.filter((g: any) => g.gap > 0).length,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (err: any) {
        console.error("AI analysis error:", err);
        return NextResponse.json({ error: "AI analysis failed", message: err.message }, { status: 500 });
    }
}
