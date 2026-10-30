import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adaptiveDifficulty, getLearningContext } from "@/lib/learningContext";
import { assessmentResponseSchema, callLocalMl, LearningError } from "@/lib/localMl";
import { createAssessment } from "@/lib/assessments";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const context = await getLearningContext(supabase, user.id);
    const difficulty = await adaptiveDifficulty(supabase, user.id, "daily");
    const result = await callLocalMl("/assessment", { role: context.role, skills: context.skills, count: 10, difficulty, context: context.role }, assessmentResponseSchema);
    const allowed = new Set(context.skills.map((s) => s.id));
    if (result.questions.some((q) => !allowed.has(q.skill_id))) throw new LearningError("Invalid assessment skill mapping.", 502);
    const session = createAssessment(user.id, result.questions, { purpose: "daily", difficulty });
    return NextResponse.json({ ...session, difficulty, difficultyLabel: result.difficultyLabel, model: result.model, unsupported_skills: result.unsupported_skills });
  } catch (error) {
    console.error("Daily assessment:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof LearningError ? error.message : "Could not prepare an assessment." }, { status: error instanceof LearningError ? error.status : 500 });
  }
}
