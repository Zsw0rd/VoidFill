import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const answers = body?.answers as { question_id: string; selected_index: number }[] | undefined;
    const aiQuestions = body?.ai_questions as { id: string; correct_index: number; skill_name: string }[] | undefined;
    const difficultyLevel = body?.difficulty_level || 1;

    if (!answers?.length) return NextResponse.json({ error: "no answers" }, { status: 400 });

    // Build question map from AI questions
    const qMap = new Map<string, any>();
    (aiQuestions || []).forEach((q) => qMap.set(q.id, { id: q.id, correct_index: q.correct_index, skill_name: q.skill_name }));

    let correct = 0;
    const perSkill: Record<string, { points: number; count: number; difficulty: number }> = {};

    answers.forEach((a) => {
        const q = qMap.get(a.question_id);
        const is_correct = q ? a.selected_index === q.correct_index : false;
        // Points scale with difficulty: easy=50, med=75, hard=100
        const basePoints = is_correct ? (difficultyLevel <= 2 ? 50 : difficultyLevel <= 3 ? 75 : 100) : 0;
        if (is_correct) correct += 1;

        const skillName = q?.skill_name || "General";
        perSkill[skillName] = perSkill[skillName] || { points: 0, count: 0, difficulty: difficultyLevel };
        perSkill[skillName].points += basePoints;
        perSkill[skillName].count += 1;
    });

    const total = answers.length;
    const scorePercent = Math.round((correct / total) * 100);

    // Map skill names to skill IDs (fuzzy match)
    const { data: allSkills } = await supabase.from("skills").select("id, name");
    const dbSkills = (allSkills || []).map((s: any) => ({ id: s.id, name: s.name, lower: s.name.toLowerCase().trim() }));

    function findSkillId(aiName: string): string | undefined {
        const lower = aiName.toLowerCase().trim();
        const exact = dbSkills.find(s => s.lower === lower);
        if (exact) return exact.id;
        const partial = dbSkills.find(s => s.lower.includes(lower) || lower.includes(s.lower));
        if (partial) return partial.id;
        const words = lower.split(/[\s.\-_/]+/).filter(w => w.length > 2);
        const wordMatch = dbSkills.find(s => {
            const dbWords = s.lower.split(/[\s.\-_/]+/).filter((w: string) => w.length > 2);
            return words.some(w => dbWords.some((dw: string) => dw.includes(w) || w.includes(dw)));
        });
        if (wordMatch) return wordMatch.id;
        return undefined;
    }

    // Update user_skill_scores with weighted blend
    const skillScoreEntries: { skill_id: string; skill_name: string; score: number }[] = [];
    const { data: existingScores } = await supabase
        .from("user_skill_scores")
        .select("skill_id, score")
        .eq("user_id", user.id);

    const prevMap = new Map<string, number>();
    (existingScores || []).forEach((r: any) => prevMap.set(r.skill_id, r.score));

    const upserts: any[] = [];
    for (const [skillName, v] of Object.entries(perSkill)) {
        const skillId = findSkillId(skillName);
        if (!skillId) continue;
        const attemptScore = Math.round(v.points / Math.max(1, v.count));
        const prev = prevMap.get(skillId);
        const newScore = prev == null ? attemptScore : Math.round(prev * 0.7 + attemptScore * 0.3);
        upserts.push({ user_id: user.id, skill_id: skillId, score: newScore, updated_at: new Date().toISOString() });
        skillScoreEntries.push({ skill_id: skillId, skill_name: skillName, score: newScore });
    }

    if (upserts.length > 0) {
        await supabase.from("user_skill_scores").upsert(upserts, { onConflict: "user_id,skill_id" });
    }

    // Update roadmap progress based on new skill scores
    for (const entry of skillScoreEntries) {
        const progress = Math.min(100, entry.score);
        await supabase.from("user_roadmap")
            .update({ progress, updated_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("skill_id", entry.skill_id);
    }

    // Check for mastered skills (≥80%) → auto-add next skills from dependencies
    const newSkillsAdded: string[] = [];
    const masteredSkillIds = skillScoreEntries.filter(e => e.score >= 80).map(e => e.skill_id);

    if (masteredSkillIds.length > 0) {
        // Find dependent skills from skill_dependencies
        const { data: depRows } = await supabase
            .from("skill_dependencies")
            .select("dependent_skill_id, skills:dependent_skill_id(name)")
            .in("prerequisite_skill_id", masteredSkillIds);

        // Check which are already in user_roadmap
        const { data: existingRoadmap } = await supabase
            .from("user_roadmap")
            .select("skill_id")
            .eq("user_id", user.id);

        const existingSkillIds = new Set((existingRoadmap || []).map((r: any) => r.skill_id));
        const { data: profile } = await supabase.from("profiles").select("target_role_id").eq("id", user.id).maybeSingle();
        const roleId = profile?.target_role_id;

        for (const dep of (depRows || [])) {
            const depSkillId = dep.dependent_skill_id;
            if (existingSkillIds.has(depSkillId)) continue;

            // Add to user_roadmap
            if (roleId) {
                await supabase.from("user_roadmap").upsert({
                    user_id: user.id,
                    role_id: roleId,
                    skill_id: depSkillId,
                    category: "Weak",
                    priority: 50,
                    status: "todo",
                    progress: 0,
                }, { onConflict: "user_id,role_id,skill_id" });
                newSkillsAdded.push((dep as any).skills?.name || "New Skill");
            }
        }
    }

    // Save practice attempt
    const { data: attempt, error: aErr } = await supabase
        .from("practice_attempts")
        .insert({
            user_id: user.id,
            score: scorePercent,
            correct_count: correct,
            total_count: total,
            difficulty_level: difficultyLevel,
            skill_scores: skillScoreEntries,
        })
        .select("*")
        .single();

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

    // Update user stats (XP, streak)
    const xp_earned = 30 + correct * 3;
    const { data: stats } = await supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle();
    const prevXp = stats?.xp ?? 0;
    const nextXp = prevXp + xp_earned;
    const nextLevel = Math.floor(nextXp / 500) + 1;

    await supabase.from("user_stats").upsert({
        user_id: user.id,
        xp: nextXp,
        level: nextLevel,
        streak: stats?.streak ?? 0,
        last_activity_date: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return NextResponse.json({
        ...attempt,
        xp_earned,
        xp_total: nextXp,
        level: nextLevel,
        newSkillsAdded,
        skillScores: skillScoreEntries,
    });
}
