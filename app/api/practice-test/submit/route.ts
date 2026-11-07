import { withApiTelemetry } from "@/lib/apiOperations";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isoDate, daysBetween } from "@/lib/date";
import { gradeAssessment, submissionSchema } from "@/lib/assessments";
import { applySkillResults } from "@/lib/learningContext";
import { LearningError } from "@/lib/localMl";
import { persistVerifiedAssessment } from "@/lib/assessmentPersistence";

async function handlePOST(req: Request) {
  const supabase = await createClient();
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
    const grade = gradeAssessment(user.id, parsed.data, "practice");
    const result = await persistVerifiedAssessment(
      supabase, user.id, grade, parsed.data.answers,
      async () => {
        // Every correct answer contributes 100 points, independent of requested difficulty.
        const skillScores = await applySkillResults(
          supabase,
          user.id,
          grade.skills,
        );
        const { data: attempt, error } = await supabase
          .from("practice_attempts")
          .insert({
            user_id: user.id,
            score: grade.score,
            correct_count: grade.correct,
            total_count: grade.total,
            difficulty_level: grade.metadata.difficulty,
            skill_scores: skillScores,
          })
          .select("*")
          .single();
        if (error)
          throw new LearningError("Could not save the practice attempt.", 500);
        const newSkillsAdded: string[] = [];
        const mastered = skillScores
          .filter((s) => s.score >= 80)
          .map((s) => s.skill_id);
        if (mastered.length) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("target_role_id")
            .eq("id", user.id)
            .maybeSingle();
          const roleId = profile?.target_role_id;
          if (roleId) {
            const [deps, roadmap, requirements, scores] = await Promise.all([
              supabase
                .from("skill_dependencies")
                .select(
                  "prerequisite_skill_id, dependent_skill_id, skills:dependent_skill_id(name)",
                ),
              supabase
                .from("user_roadmap")
                .select("skill_id")
                .eq("user_id", user.id)
                .eq("role_id", roleId),
              supabase
                .from("role_skills")
                .select("skill_id")
                .eq("role_id", roleId),
              supabase
                .from("user_skill_scores")
                .select("skill_id, score")
                .eq("user_id", user.id),
            ]);
            if (
              deps.error ||
              roadmap.error ||
              requirements.error ||
              scores.error
            )
              throw new LearningError(
                "Could not update prerequisite progress.",
                500,
              );
            const existing = new Set(
              (roadmap.data || []).map((s) => s.skill_id),
            );
            const roleSkills = new Set(
              (requirements.data || []).map((s) => s.skill_id),
            );
            const scoreMap = new Map(
              (scores.data || []).map((s) => [s.skill_id, s.score]),
            );
            const candidates = (deps.data || []).filter((d) =>
              mastered.includes(d.prerequisite_skill_id),
            );
            for (const dep of candidates) {
              if (
                !roleSkills.has(dep.dependent_skill_id) ||
                existing.has(dep.dependent_skill_id)
              )
                continue;
              const prerequisites = (deps.data || []).filter(
                (d) => d.dependent_skill_id === dep.dependent_skill_id,
              );
              if (
                prerequisites.some(
                  (d) => (scoreMap.get(d.prerequisite_skill_id) || 0) < 80,
                )
              )
                continue;
              const { error: unlockError } = await supabase
                .from("user_roadmap")
                .upsert(
                  {
                    user_id: user.id,
                    role_id: roleId,
                    skill_id: dep.dependent_skill_id,
                    category: "Missing",
                    priority: 4,
                    status: "todo",
                    progress: 0,
                  },
                  { onConflict: "user_id,role_id,skill_id" },
                );
              if (unlockError)
                throw new LearningError(
                  "Could not save prerequisite progress.",
                  500,
                );
              existing.add(dep.dependent_skill_id);
              newSkillsAdded.push((dep as any).skills?.name || "New Skill");
            }
          }
        }
        const xp_earned = 30 + grade.correct * 3;
        const { data: stats, error: statsReadError } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (statsReadError)
          throw new LearningError("Could not load learning statistics.", 500);
        const xp_total = (stats?.xp || 0) + xp_earned;
        const level = Math.floor(xp_total / 500) + 1;
        const today = isoDate(new Date());
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
          newSkillsAdded,
          skillScores,
          review: grade.review,
        };
      },
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Practice grading:",
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

export const POST = withApiTelemetry("practice_submission", handlePOST);
