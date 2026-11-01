import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isoDate, daysBetween } from "@/lib/date";
import { gradeAssessment, submissionSchema } from "@/lib/assessments";
import { applySkillResults } from "@/lib/learningContext";
import { LearningError } from "@/lib/localMl";
import { persistAssessmentOnce } from "@/lib/submissions";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = submissionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid assessment submission." },
      { status: 400 },
    );
  try {
    const grade = gradeAssessment(user.id, parsed.data, "daily");
    const result = await persistAssessmentOnce(
      grade.assessmentId,
      async () => {
        const today = isoDate(new Date());
        const { data: existing, error: existingError } = await supabase
          .from("daily_attempts")
          .select("*")
          .eq("user_id", user.id)
          .eq("attempt_date", today)
          .maybeSingle();
        if (existingError)
          throw new LearningError("Could not load today's attempt.", 500);
        if (existing?.completed_at)
          return { ...existing, review: grade.review, alreadyCompleted: true };
        const xp_earned = 50 + grade.correct * 5;
        const { data: attempt, error } = await supabase
          .from("daily_attempts")
          .upsert(
            {
              user_id: user.id,
              attempt_date: today,
              completed_at: new Date().toISOString(),
              correct_count: grade.correct,
              total_count: grade.total,
              xp_earned,
              difficulty_level: grade.metadata.difficulty,
            },
            { onConflict: "user_id,attempt_date" },
          )
          .select("*")
          .single();
        if (error)
          throw new LearningError("Could not save the daily attempt.", 500);
        const { error: skillError } = await supabase
          .from("attempt_skill_scores")
          .upsert(
            grade.skills.map((s) => ({
              attempt_id: attempt.id,
              skill_id: s.skill_id,
              score: s.score,
            })),
            { onConflict: "attempt_id,skill_id" },
          );
        if (skillError)
          throw new LearningError("Could not save attempt skill scores.", 500);
        await applySkillResults(supabase, user.id, grade.skills);
        const { data: stats, error: statsReadError } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (statsReadError)
          throw new LearningError("Could not load learning statistics.", 500);
        const xp_total = (stats?.xp || 0) + xp_earned;
        const level = Math.floor(xp_total / 500) + 1;
        const gap = stats?.last_activity_date
          ? daysBetween(stats.last_activity_date, today)
          : null;
        const streak =
          gap === 0
            ? Math.max(stats?.streak || 0, 1)
            : gap === 1
              ? (stats?.streak || 0) + 1
              : 1;
        const { error: statsError } = await supabase
          .from("user_stats")
          .upsert(
            {
              user_id: user.id,
              xp: xp_total,
              level,
              streak,
              last_activity_date: today,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        if (statsError)
          throw new LearningError("Could not save learning statistics.", 500);
        return {
          ...attempt,
          xp_earned,
          xp_total,
          level,
          streak,
          review: grade.review,
        };
      },
      (supabase as any).__demoToken,
      user.id,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Daily grading:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        error:
          error instanceof LearningError
            ? error.message
            : "Could not save assessment results.",
      },
      { status: error instanceof LearningError ? error.status : 500 },
    );
  }
}
