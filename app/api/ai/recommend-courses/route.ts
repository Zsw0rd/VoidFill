import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLearningContext } from "@/lib/learningContext";
import { callLocalMl, LearningError, recommendationResponseSchema } from "@/lib/localMl";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const context = await getLearningContext(supabase, user.id);
    const result = await callLocalMl("/recommend", { role: context.role, skills: context.skills, limit: 4 }, recommendationResponseSchema);
    const allowed = new Set(context.skills.map((s) => s.id));
    if (result.recommendations.some((r) => !allowed.has(r.skill_id))) throw new LearningError("Invalid recommendation skill mapping.", 502);
    const { data: existing, error: readError } = await supabase.from("roadmap_courses").select("skill_id, url").eq("user_id", user.id);
    if (readError) throw new LearningError("Could not load existing resources.", 500);
    const known = new Set((existing || []).map((r) => r.skill_id + ":" + r.url));
    const rows: any[] = [];
    let matched = 0;
    for (const rec of result.recommendations) {
      for (const [index, resource] of rec.resources.entries()) {
        matched++;
        const identity = rec.skill_id + ":" + resource.url;
        if (known.has(identity)) continue;
        known.add(identity);
        rows.push({ user_id: user.id, skill_id: rec.skill_id, title: resource.title, type: resource.type, provider: resource.provider, url: resource.url, estimated_hours: resource.estimated_hours, difficulty: resource.difficulty, description: resource.description, sort_order: index });
      }
    }
    // Preserve stable course IDs, completions and assessment history on refresh.
    if (rows.length) {
      const { error } = await supabase.from("roadmap_courses").insert(rows);
      if (error) throw new LearningError("Could not save recommended resources.", 500);
    }
    return NextResponse.json({ saved: rows.length, matched, unmatched: result.unsupported_skills, model: result.model, message: `${matched} resources matched; ${rows.length} new resources added.` });
  } catch (error) {
    console.error("Resource recommendations:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof LearningError ? error.message : "Could not recommend resources." }, { status: error instanceof LearningError ? error.status : 500 });
  }
}
