import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isoDate, daysBetween } from "@/lib/date";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const answers = body?.answers as { question_id: string; selected_index: number }[] | undefined;
  if (!answers?.length) return NextResponse.json({ error: "no answers" }, { status: 400 });

  const today = isoDate(new Date());

  const { data: existing } = await supabase
    .from("daily_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("attempt_date", today)
    .maybeSingle();

  if (existing?.completed_at) return NextResponse.json(existing);

  const qIds = answers.map((a) => a.question_id);
  const { data: qs, error: qErr } = await supabase
    .from("questions")
    .select("id, skill_id, correct_index")
    .in("id", qIds);

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  const qMap = new Map<string, any>();
  (qs || []).forEach((q) => qMap.set(q.id, q));

  let correct = 0;
  const perSkill: Record<string, { points: number; count: number }> = {};

  const answerRows = answers.map((a) => {
    const q = qMap.get(a.question_id);
    const is_correct = q ? a.selected_index === q.correct_index : false;
    const points = is_correct ? 100 : 0;
    if (is_correct) correct += 1;
    const skill_id = q?.skill_id || null;
    if (skill_id) {
      perSkill[skill_id] = perSkill[skill_id] || { points: 0, count: 0 };
      perSkill[skill_id].points += points;
      perSkill[skill_id].count += 1;
    }
    return {
      question_id: a.question_id,
      selected_index: a.selected_index,
      is_correct,
      points,
      skill_id,
    };
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
    }, { onConflict: "user_id,attempt_date" })
    .select("*")
    .single();

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  const attempt_id = attempt.id;

  const { error: ansErr } = await supabase.from("attempt_answers").insert(
    answerRows.map((r) => ({ ...r, attempt_id })),
  );

  if (ansErr) return NextResponse.json({ error: ansErr.message }, { status: 500 });

  const skillScoreRows = Object.entries(perSkill).map(([skill_id, v]) => {
    const score = Math.round(v.points / Math.max(1, v.count));
    return { attempt_id, skill_id, score };
  });

  if (skillScoreRows.length) {
    await supabase.from("attempt_skill_scores").upsert(skillScoreRows, { onConflict: "attempt_id,skill_id" });

    const { data: existingScores } = await supabase
      .from("user_skill_scores")
      .select("skill_id, score")
      .eq("user_id", user.id)
      .in("skill_id", skillScoreRows.map((s) => s.skill_id));

    const prevMap = new Map<string, number>();
    (existingScores || []).forEach((r) => prevMap.set(r.skill_id, r.score));

    const upserts = skillScoreRows.map((r) => {
      const prev = prevMap.get(r.skill_id);
      const newScore = prev == null ? r.score : Math.round(prev * 0.7 + r.score * 0.3);
      return { user_id: user.id, skill_id: r.skill_id, score: newScore, updated_at: new Date().toISOString() };
    });

    await supabase.from("user_skill_scores").upsert(upserts, { onConflict: "user_id,skill_id" });
  }

  const { data: stats } = await supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle();
  const prevXp = stats?.xp ?? 0;
  const prevLevel = stats?.level ?? 1;
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

  return NextResponse.json({ ...attempt, xp_total: nextXp, level: nextLevel, streak: nextStreak });
}
