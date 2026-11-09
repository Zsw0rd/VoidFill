import { operationBudget, withApiTelemetry } from "@/lib/apiOperations";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getLearningContext, prepareAssessmentContext } from "@/lib/learningContext";
import { assessmentResponseSchema, callLocalMl, LearningError } from "@/lib/localMl";
import { createAssessment } from "@/lib/assessments";
import { careerAssessmentDifficulty } from "@/lib/careerCatalog";
import { loadCourseAssessmentContext } from "@/lib/assessmentSelection";

const inputSchema = z.object({ purpose: z.enum(["practice", "course", "skill"]), skill_id: z.string().uuid().optional(), course_id: z.string().uuid().optional() });

async function handlePOST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const budgetResponse = await operationBudget(supabase, user.id, "assessment");
  if (budgetResponse) return budgetResponse;
  const parsed = inputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid assessment request." }, { status: 400 });
  try {
    const body = parsed.data;
    const preparation = body.purpose === "practice"
      ? await prepareAssessmentContext(supabase, user.id, "practice")
      : null;
    const context = preparation || await getLearningContext(supabase, user.id);
    let skills = context.skills;
    let courseTitle = "";
    let courseId: string | undefined;
    let resourceUrl: string | undefined;
    if (body.purpose === "course") {
      if (!body.course_id) throw new LearningError("Choose a course to assess.", 400);
      const course = await loadCourseAssessmentContext(supabase, user.id, body.course_id, skills);
      skills = course.skills;
      courseTitle = course.courseTitle;
      courseId = course.courseId;
      resourceUrl = course.resourceUrl;
    } else if (body.purpose === "skill") {
      skills = skills.filter((s) => s.id === body.skill_id);
    }
    if (!skills.length) throw new LearningError("This skill is not configured for your current role.", 400);
    const suggested = preparation ? preparation.difficulty : Math.max(1, Math.ceil((skills[0].score || 0) / 20));
    const difficulty = careerAssessmentDifficulty(context.level, suggested);
    const result = await callLocalMl("/assessment", { skills, role: context.role, count: body.purpose === "course" && difficulty < 3 ? 12 : 10, difficulty, context: courseTitle, purpose: body.purpose === "course" ? "course" : "skill", ...(resourceUrl ? {resource_url: resourceUrl} : {}) }, assessmentResponseSchema);
    const allowed = new Set(skills.map((s) => s.id));
    if (result.questions.some((q) => !allowed.has(q.skill_id))) throw new LearningError("Invalid assessment skill mapping.", 502);
    const session = createAssessment(user.id, result.questions, { purpose: body.purpose, difficulty: result.difficulty, contextKey: context.assessmentContext, ...(courseId ? { courseId } : {}), ...(body.purpose !== "practice" ? { skillId: skills[0].id } : {}) });
    return NextResponse.json({ ...session, difficulty: result.difficulty, difficultyLabel: result.difficultyLabel, model: result.model, unsupported_skills: result.unsupported_skills });
  } catch (error) {
    console.error("Assessment preparation:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof LearningError ? error.message : "Could not prepare an assessment." }, { status: error instanceof LearningError ? error.status : 500 });
  }
}

export const POST = withApiTelemetry("roadmap_assessment", handlePOST);
