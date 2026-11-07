import { trustedLearningWriter } from "@/lib/assessmentPersistence";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { categoryFromScore, priorityScore } from "@/lib/gapLogic";
import { roadmapProgress } from "@/lib/roadmapProgress";
import { getLearningContext } from "@/lib/learningContext";
import { LearningError } from "@/lib/localMl";
import { sameOrigin } from "@/lib/demo/server";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error: "Invalid origin"}, {status: 403});
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: "unauthorized"}, {status: 401});
  try {
    const context = await getLearningContext(supabase, user.id);
    const [deps, resources, existing] = await Promise.all([
      supabase.from("skill_dependencies").select("prerequisite_skill_id,dependent_skill_id"),
      supabase.from("roadmap_courses").select("skill_id,completed").eq("user_id", user.id),
      supabase.from("user_roadmap").select("skill_id,status").eq("user_id", user.id).eq("role_id", context.roleId),
    ]);
    if (deps.error || resources.error || existing.error) throw new LearningError("Could not load roadmap progress.", 500);
    const skillIds = new Set(context.skills.map(skill => skill.id));
    const statuses = new Map((existing.data || []).map(row => [row.skill_id, row.status]));
    const rows = context.skills.map(skill => {
      const score = skill.score ?? 0;
      const dependencyBonus = (deps.data || []).some(row => row.prerequisite_skill_id === skill.id && skillIds.has(row.dependent_skill_id)) ? 2 : 1;
      return {user_id: user.id, role_id: context.roleId, skill_id: skill.id, category: categoryFromScore(score), priority: priorityScore({score, roleWeight: skill.importance ?? .8, dependencyBonus}), progress: roadmapProgress(score, (resources.data || []).filter(row => row.skill_id === skill.id)), status: statuses.get(skill.id) || "todo", updated_at: new Date().toISOString()};
    });
    const {error} = await trustedLearningWriter(supabase).from("user_roadmap").upsert(rows, {onConflict: "user_id,role_id,skill_id"});
    if (error) throw new LearningError("Could not save your roadmap.", 500);
    return NextResponse.json({ok: true, count: rows.length});
  } catch (error) {return NextResponse.json({error: error instanceof Error ? error.message : "Could not generate roadmap."}, {status: error instanceof LearningError ? error.status : 500});}
}
