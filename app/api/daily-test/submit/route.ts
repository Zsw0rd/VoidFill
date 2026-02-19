import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isoDate, daysBetween } from "@/lib/date";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const answers = body?.answers as { question_id: string; selected_index: number }[] | undefined;
  const aiQuestions = body?.ai_questions as { id: string; correct_index: number; skill_name: string }[] | undefined;
  const difficultyLevel = body?.difficulty_level || 1;

  if (!answers?.length) return NextResponse.json({ error: "no answers" }, { status: 400 });

  const today = isoDate(new Date());

  const { data: existing } = await supabase
    .from("daily_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("attempt_date", today)
    .maybeSingle();

  if (existing?.completed_at) return NextResponse.json(existing);

  // Build question map — either from AI questions or from database
  const isAiTest = aiQuestions && aiQuestions.length > 0;
  let qMap = new Map<string, any>();

  if (isAiTest) {
    // AI-generated questions — use the correct_index from the payload
    aiQuestions.forEach((q) => qMap.set(q.id, { id: q.id, correct_index: q.correct_index, skill_name: q.skill_name }));
  } else {
    // Database questions
    const qIds = answers.map((a) => a.question_id);
    const { data: qs, error: qErr } = await supabase
      .from("questions")
      .select("id, skill_id, correct_index")
      .in("id", qIds);

    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
    (qs || []).forEach((q) => qMap.set(q.id, q));
  }

  let correct = 0;
  const perSkill: Record<string, { points: number; count: number }> = {};

  // For AI tests, we track by skill_name; for DB tests, by skill_id
  const answerRows: any[] = [];
  answers.forEach((a) => {
    const q = qMap.get(a.question_id);
    const is_correct = q ? a.selected_index === q.correct_index : false;
    const points = is_correct ? 100 : 0;
    if (is_correct) correct += 1;

    if (isAiTest) {
      // Track by skill name
      const skillName = q?.skill_name || "General";
      perSkill[skillName] = perSkill[skillName] || { points: 0, count: 0 };
      perSkill[skillName].points += points;
      perSkill[skillName].count += 1;
    } else {
      const skill_id = q?.skill_id || null;
      if (skill_id) {
        perSkill[skill_id] = perSkill[skill_id] || { points: 0, count: 0 };
        perSkill[skill_id].points += points;
        perSkill[skill_id].count += 1;
      }
      answerRows.push({
        question_id: a.question_id,
        selected_index: a.selected_index,
        is_correct,
        points,
        skill_id,
      });
    }
  });

  const total = answers.length;
  const xp_earned = 50 + correct * 5;

  const { data: attempt, error: aErr } = await supabase
    .from("daily_attempts")
    .upsert({
      user_id: user.id,
      attempt_date: today,
      completed_at: new Date().toISOString(),
      correct_count: correct,
      total_count: total,
      xp_earned,
      difficulty_level: difficultyLevel,
    }, { onConflict: "user_id,attempt_date" })
    .select("*")
    .single();

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  const attempt_id = attempt.id;

  // Insert answer rows only for DB questions (AI questions don't have DB entries)
  if (answerRows.length > 0) {
    await supabase.from("attempt_answers").insert(answerRows.map((r) => ({ ...r, attempt_id })));
  }

  // Update skill scores
  if (isAiTest) {
    // For AI tests, we need to map skill names to skill IDs
    const skillNames = Object.keys(perSkill);
    const { data: skills } = await supabase.from("skills").select("id, name").in("name", skillNames);
    const nameToId = new Map<string, string>();
    (skills || []).forEach((s: any) => nameToId.set(s.name, s.id));

    const skillScoreRows: any[] = [];
    for (const [skillName, v] of Object.entries(perSkill)) {
      const skillId = nameToId.get(skillName);
      if (!skillId) continue;
      const score = Math.round(v.points / Math.max(1, v.count));
      skillScoreRows.push({ attempt_id, skill_id: skillId, score });
    }

    if (skillScoreRows.length > 0) {
      await supabase.from("attempt_skill_scores").upsert(skillScoreRows, { onConflict: "attempt_id,skill_id" });
      await updateUserSkillScores(supabase, user.id, skillScoreRows);
    }
  } else {
    // Original DB-based scoring
    const skillScoreRows = Object.entries(perSkill).map(([skill_id, v]) => {
      const score = Math.round(v.points / Math.max(1, v.count));
      return { attempt_id, skill_id, score };
    });

    if (skillScoreRows.length) {
      await supabase.from("attempt_skill_scores").upsert(skillScoreRows, { onConflict: "attempt_id,skill_id" });
      await updateUserSkillScores(supabase, user.id, skillScoreRows);
    }
  }

  // Update user stats (XP, level, streak)
  const { data: stats } = await supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle();
  const prevXp = stats?.xp ?? 0;
  const nextXp = prevXp + xp_earned;
  const nextLevel = Math.floor(nextXp / 500) + 1;

  let nextStreak = stats?.streak ?? 0;
  if (stats?.last_activity_date) {
    const diff = daysBetween(stats.last_activity_date, today);
    nextStreak = diff === 1 ? nextStreak + 1 : 1;
  } else {
    nextStreak = 1;
  }

  await supabase.from("user_stats").upsert({
    user_id: user.id,
    xp: nextXp,
    level: nextLevel,
    streak: nextStreak,
    last_activity_date: today,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  return NextResponse.json({ ...attempt, xp_earned, xp_total: nextXp, level: nextLevel, streak: nextStreak });
}

async function updateUserSkillScores(supabase: any, userId: string, skillScoreRows: any[]) {
  const { data: existingScores } = await supabase
    .from("user_skill_scores")
    .select("skill_id, score")
    .eq("user_id", userId)
    .in("skill_id", skillScoreRows.map((s: any) => s.skill_id));

  const prevMap = new Map<string, number>();
  (existingScores || []).forEach((r: any) => prevMap.set(r.skill_id, r.score));

  const upserts = skillScoreRows.map((r: any) => {
    const prev = prevMap.get(r.skill_id);
    const newScore = prev == null ? r.score : Math.round(prev * 0.7 + r.score * 0.3);
    return { user_id: userId, skill_id: r.skill_id, score: newScore, updated_at: new Date().toISOString() };
  });

  await supabase.from("user_skill_scores").upsert(upserts, { onConflict: "user_id,skill_id" });
}
