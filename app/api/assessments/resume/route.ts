import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resumeAssessment } from "@/lib/assessments";
import { getLearningContext } from "@/lib/learningContext";
import { LearningError } from "@/lib/localMl";
import { readBoundedText, RequestBodyError } from "@/lib/requestBody";
import { withApiTelemetry } from "@/lib/apiOperations";

const inputSchema = z.object({
  purpose: z.enum(["daily", "practice", "course", "skill"]),
  assessment_token: z.string().min(30).max(300000),
}).strict();

async function handlePOST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const input = inputSchema.safeParse(JSON.parse(await readBoundedText(request, 310000)));
    if (!input.success) return NextResponse.json({ error: "Invalid assessment draft." }, { status: 400 });
    const context = await getLearningContext(client, user.id);
    const session = resumeAssessment(user.id, input.data.assessment_token, input.data.purpose, context.assessmentContext);
    let target: { skillId: string; skillName: string; course?: { id: string; title: string } } | undefined;
    if (session.purpose === "course" || session.purpose === "skill") {
      const skill = context.skills.find(row => row.id === session.skill_id);
      if (!skill) throw new LearningError("This learning area is no longer in your current direction. Start a new assessment.", 409);
      target = { skillId: skill.id, skillName: skill.name };
      if (session.purpose === "course") {
        const { data: course, error } = await client.from("roadmap_courses").select("id,title,skill_id").eq("id", session.course_id!).eq("user_id", user.id).maybeSingle();
        if (error) throw new LearningError("Your assessment could not be restored. Try again shortly.", 503);
        if (!course || course.skill_id !== skill.id) throw new LearningError("This course is no longer available. Start a new assessment.", 409);
        target.course = { id: course.id, title: course.title };
      }
    }
    return NextResponse.json({ ...session, ...(target ? { target } : {}) });
  } catch (error) {
    const status = error instanceof LearningError || error instanceof RequestBodyError ? error.status : error instanceof SyntaxError ? 400 : 503;
    return NextResponse.json({ error: error instanceof LearningError ? error.message : "Your assessment could not be restored. Try again shortly." }, { status });
  }
}

export const POST = withApiTelemetry("assessment_resume", handlePOST);
