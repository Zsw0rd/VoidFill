import { operationBudget, withApiTelemetry } from "@/lib/apiOperations";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adaptiveDifficulty, getLearningContext } from "@/lib/learningContext";
import { assessmentResponseSchema, callLocalMl, LearningError } from "@/lib/localMl";
import { createAssessment } from "@/lib/assessments";
import { careerAssessmentDifficulty } from "@/lib/careerCatalog";

async function handlePOST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const budgetResponse = await operationBudget(supabase, user.id, "assessment");
  if (budgetResponse) return budgetResponse;
  try {
    const context = await getLearningContext(supabase, user.id);
    const difficulty = careerAssessmentDifficulty(context.level, await adaptiveDifficulty(supabase, user.id, "daily"));
    const result = await callLocalMl("/assessment", { role: context.role, skills: context.skills, count: 10, difficulty }, assessmentResponseSchema);
    const allowed = new Set(context.skills.map((s) => s.id));
    if (result.questions.some((q) => !allowed.has(q.skill_id))) throw new LearningError("Invalid assessment skill mapping.", 502);
    const session = createAssessment(user.id, result.questions, { purpose: "daily", difficulty: result.difficulty });
    return NextResponse.json({ ...session, difficulty: result.difficulty, difficultyLabel: result.difficultyLabel, model: result.model, unsupported_skills: result.unsupported_skills });
  } catch (error) {
    console.error("Daily assessment:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof LearningError ? error.message : "Could not prepare an assessment." }, { status: error instanceof LearningError ? error.status : 500 });
  }
}

export const POST = withApiTelemetry("daily_assessment", handlePOST);
