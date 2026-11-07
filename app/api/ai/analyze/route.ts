import { operationBudget, withApiTelemetry } from "@/lib/apiOperations";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getLearningContext } from "@/lib/learningContext";
import { learningContextKey } from "@/lib/learningContextKey";
import { callLocalMl, LearningError } from "@/lib/localMl";

const analysisSchema = z.object({
  model: z.string(), unsupported_skills: z.array(z.string()),
  analysis: z.object({
    overallAssessment: z.string(), strengthAreas: z.array(z.string()),
    criticalGaps: z.array(z.object({
      skill: z.string(), currentScore: z.number(), targetScore: z.number(), gap: z.number(), assessed: z.boolean(),
      severity: z.string(), recommendation: z.string(),
      resources: z.array(z.object({ title: z.string(), type: z.string(), provider: z.string(), url: z.string().url() })),
    })),
    learningPath: z.array(z.object({ phase: z.number(), title: z.string(), duration: z.string(), focus: z.string(), milestones: z.array(z.string()) })),
    motivationalTip: z.string(),
  }),
});

async function handlePOST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const budgetResponse = await operationBudget(supabase, user.id, "insight");
  if (budgetResponse) return budgetResponse;
  try {
    const context = await getLearningContext(supabase, user.id);
    const { data: attempts, error: attemptsError } = await supabase.from("daily_attempts").select("correct_count, total_count, difficulty_level").eq("user_id", user.id).not("completed_at", "is", null).order("attempt_date", { ascending: false }).limit(10);
    if (attemptsError) throw new LearningError("Could not load test history.", 500);
    const average = attempts?.length ? Math.round(attempts.reduce((sum, a) => sum + (a.total_count ? a.correct_count / a.total_count * 100 : 0), 0) / attempts.length) : 0;
    const result = await callLocalMl("/analyze", { role: context.role, skills: context.skills, limit: 3, average_test_score: average, test_count: attempts?.length || 0 }, analysisSchema);
    const meta = { engine: "local-ml", contextKey: learningContextKey(context), model: result.model, skillCount: context.skills.length, gapCount: result.analysis.criticalGaps.length, avgTestScore: average, difficulty: attempts?.[0]?.difficulty_level || 1, unsupportedSkills: result.unsupported_skills, timestamp: new Date().toISOString() };
    const { error } = await supabase.from("ai_insights").upsert({ user_id: user.id, analysis: result.analysis, meta, updated_at: meta.timestamp }, { onConflict: "user_id" });
    if (error) throw new LearningError("Could not save your insights.", 500);
    return NextResponse.json({ analysis: result.analysis, meta });
  } catch (error) {
    console.error("Learning analysis:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof LearningError ? error.message : "Could not analyze skill gaps." }, { status: error instanceof LearningError ? error.status : 500 });
  }
}

export const POST = withApiTelemetry("insight", handlePOST);
