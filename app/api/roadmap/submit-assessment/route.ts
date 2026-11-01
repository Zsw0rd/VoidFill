import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  const raw = await req.json().catch(() => null);
  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success || !["course", "skill"].includes(raw?.purpose))
    return NextResponse.json(
      { error: "Invalid assessment submission." },
      { status: 400 },
    );
  try {
    const grade = gradeAssessment(user.id, parsed.data, raw.purpose);
    if (!grade.metadata.skillId)
      throw new LearningError("Invalid skill assessment.", 400);
    const result = await persistAssessmentOnce(
      grade.assessmentId,
      async () => {
        const passed = grade.score >= 65;
        if (grade.metadata.purpose === "course") {
          const { data: course, error: courseError } = await supabase
            .from("roadmap_courses")
            .select("id, skill_id")
            .eq("id", grade.metadata.courseId!)
            .eq("user_id", user.id)
            .maybeSingle();
          if (
            courseError ||
            !course ||
            course.skill_id !== grade.metadata.skillId
          )
            throw new LearningError("Course not found.", 404);
          const { error } = await supabase
            .from("course_assessments")
            .insert({
              user_id: user.id,
              course_id: course.id,
              score: grade.score,
              total: grade.total,
              passed,
              answers: Object.fromEntries(
                parsed.data.answers.map((a) => [
                  a.question_id,
                  a.selected_index,
                ]),
              ),
            });
          if (error)
            throw new LearningError(
              "Could not save the course assessment.",
              500,
            );
          if (passed) {
            const { error: completionError } = await supabase
              .from("roadmap_courses")
              .update({ completed: true })
              .eq("id", course.id)
              .eq("user_id", user.id);
            if (completionError)
              throw new LearningError("Could not save course completion.", 500);
          }
        }
        const skillScores = await applySkillResults(
          supabase,
          user.id,
          grade.skills,
        );
        return {
          score: grade.score,
          correct: grade.correct,
          total: grade.total,
          passed,
          skillScores,
          review: grade.review,
        };
      },
      (supabase as any).__demoToken,
      user.id,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Course grading:",
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
