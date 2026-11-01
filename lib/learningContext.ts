import { createClient } from "@/lib/supabase/server";
import { LearningError, type LearningSkill } from "./localMl";
import { roadmapProgress } from "./roadmapProgress";

export async function getLearningContext(supabase: ReturnType<typeof createClient>, userId: string) {
  const [profileRes, scoresRes] = await Promise.all([
    supabase.from("profiles").select("target_role_id, custom_target_role, roles(name)").eq("id", userId).maybeSingle(),
    supabase.from("user_skill_scores").select("skill_id, score").eq("user_id", userId),
  ]);
  if (profileRes.error || scoresRes.error) throw new LearningError("Could not load learner data.", 500);
  const profile = profileRes.data;
  if (!profile?.target_role_id) throw new LearningError("Choose a learning track in your profile before starting this activity.", 400);
  const { data, error } = await supabase.from("role_skills").select("skill_id, weight, skills(name)").eq("role_id", profile.target_role_id);
  if (error) throw new LearningError("Could not load role requirements.", 500);
  const scores = new Map((scoresRes.data || []).map((s) => [s.skill_id, Number(s.score)]));
  const skills: LearningSkill[] = (data || []).map((row: any) => ({
    id: row.skill_id, name: row.skills?.name || "Skill", score: scores.get(row.skill_id) ?? null,
    // The current schema uses role weight for both importance and benchmark.
    target: Math.max(0, Math.min(100, Math.round(Number(row.weight ?? .75) * 100))), importance: Number(row.weight ?? 1),
  }));
  if (!skills.length) throw new LearningError("No skills have been configured for this role.", 400);
  return { role: (profile as any).roles?.name || profile.custom_target_role || "Learner", roleId: profile.target_role_id, skills };
}

export async function adaptiveDifficulty(supabase: ReturnType<typeof createClient>, userId: string, kind: "daily" | "practice") {
  const { data, error } = kind === "daily"
    ? await supabase.from("daily_attempts").select("correct_count, total_count, difficulty_level").eq("user_id", userId).not("completed_at", "is", null).order("attempt_date", { ascending: false }).limit(5)
    : await supabase.from("practice_attempts").select("correct_count, total_count, difficulty_level").eq("user_id", userId).order("created_at", { ascending: false }).limit(5);
  if (error) throw new LearningError("Could not load assessment history.", 500);
  if (!data?.length) return 1;
  const average = data.reduce((sum, a) => sum + (a.total_count ? a.correct_count / a.total_count * 100 : 0), 0) / data.length;
  const previous = Number(data[0].difficulty_level || 1);
  return Math.min(5, Math.max(1, previous + (average >= 80 ? 1 : average < 40 ? -1 : 0)));
}

export async function applySkillResults(supabase: ReturnType<typeof createClient>, userId: string, results: { skill_id: string; skill_name: string; score: number }[]) {
  const ids = results.map((r) => r.skill_id);
  const [scoresRes, coursesRes] = await Promise.all([
    supabase.from("user_skill_scores").select("skill_id, score").eq("user_id", userId).in("skill_id", ids),
    supabase.from("roadmap_courses").select("skill_id, completed").eq("user_id", userId).in("skill_id", ids),
  ]);
  if (scoresRes.error || coursesRes.error) throw new LearningError("Could not load skill progress.", 500);
  const previous = new Map((scoresRes.data || []).map((s) => [s.skill_id, Number(s.score)]));
  const rows = results.map((r) => ({ user_id: userId, skill_id: r.skill_id, score: previous.has(r.skill_id) ? Math.round(previous.get(r.skill_id)! * .7 + r.score * .3) : r.score, updated_at: new Date().toISOString() }));
  const { error } = await supabase.from("user_skill_scores").upsert(rows, { onConflict: "user_id,skill_id" });
  if (error) throw new LearningError("Could not save skill progress.", 500);
  for (const row of rows) {
    const courses = (coursesRes.data || []).filter((c) => c.skill_id === row.skill_id);
    const { error: roadmapError } = await supabase.from("user_roadmap").update({ progress: roadmapProgress(row.score, courses), updated_at: row.updated_at }).eq("user_id", userId).eq("skill_id", row.skill_id);
    if (roadmapError) throw new LearningError("Could not save roadmap progress.", 500);
  }
  return rows.map((r) => ({ skill_id: r.skill_id, skill_name: results.find((s) => s.skill_id === r.skill_id)!.skill_name, score: r.score }));
}
