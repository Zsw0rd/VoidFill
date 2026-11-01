import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adaptiveDifficulty, getLearningContext } from "@/lib/learningContext";
import { assessmentResponseSchema, callLocalMl, LearningError } from "@/lib/localMl";
import { createAssessment } from "@/lib/assessments";

const inputSchema = z.object({ purpose: z.enum(["practice", "course", "skill"]), skill_id: z.string().uuid().optional(), course_id: z.string().uuid().optional() });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = inputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid assessment request." }, { status: 400 });
  try {
    const body = parsed.data;
    const context = await getLearningContext(supabase, user.id);
    let skills = context.skills;
    let courseTitle = context.role;
    let courseId: string | undefined;
    if (body.purpose === "course") {
      if (!body.course_id) throw new LearningError("Choose a course to assess.", 400);
      const { data: course, error } = await supabase.from("roadmap_courses").select("id, skill_id, title").eq("id", body.course_id).eq("user_id", user.id).maybeSingle();
      if (error) throw new LearningError("Could not load the course.", 500);
      if (!course) throw new LearningError("Course not found.", 404);
      skills = skills.filter((s) => s.id === course.skill_id);
      courseTitle = course.title;
      courseId = course.id;
    } else if (body.purpose === "skill") {
      skills = skills.filter((s) => s.id === body.skill_id);
      courseTitle = skills[0]?.name || context.role;
    }
    if (!skills.length) throw new LearningError("This skill is not configured for your current role.", 400);
    const difficulty = body.purpose === "practice" ? await adaptiveDifficulty(supabase, user.id, "practice") : Math.min(5, Math.max(1, Math.ceil((skills[0].score || 0) / 20)));
    const result = await callLocalMl("/assessment", { skills, role: context.role, count: body.purpose === "course" ? 12 : 10, difficulty, context: courseTitle }, assessmentResponseSchema);
    const allowed = new Set(skills.map((s) => s.id));
    if (result.questions.some((q) => !allowed.has(q.skill_id))) throw new LearningError("Invalid assessment skill mapping.", 502);
    const session = createAssessment(user.id, result.questions, { purpose: body.purpose, difficulty, ...(courseId ? { courseId } : {}), ...(body.purpose !== "practice" ? { skillId: skills[0].id } : {}) });
    return NextResponse.json({ ...session, difficulty, difficultyLabel: result.difficultyLabel, model: result.model, unsupported_skills: result.unsupported_skills });
  } catch (error) {
    console.error("Assessment preparation:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof LearningError ? error.message : "Could not prepare an assessment." }, { status: error instanceof LearningError ? error.status : 500 });
  }
}
