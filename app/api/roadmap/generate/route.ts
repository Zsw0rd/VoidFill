import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { categoryFromScore, priorityScore } from "@/lib/gapLogic";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile, error: pErr } = await supabase.from("profiles").select("target_role_id").eq("id", user.id).maybeSingle();
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  const roleId = profile?.target_role_id;
  if (!roleId) return NextResponse.json({ error: "no role selected" }, { status: 400 });

  const [rs, deps, us] = await Promise.all([
    supabase.from("role_skills").select("skill_id, weight").eq("role_id", roleId),
    supabase.from("skill_dependencies").select("prerequisite_skill_id, dependent_skill_id"),
    supabase.from("user_skill_scores").select("skill_id, score").eq("user_id", user.id),
  ]);

  if (rs.error) return NextResponse.json({ error: rs.error.message }, { status: 500 });
  if (deps.error) return NextResponse.json({ error: deps.error.message }, { status: 500 });
  if (us.error) return NextResponse.json({ error: us.error.message }, { status: 500 });

  const roleSkills = rs.data || [];
  const roleSkillIds = new Set(roleSkills.map((r) => r.skill_id));

  const dependsOn = new Map<string, Set<string>>();
  (deps.data || []).forEach((x: any) => {
    const set = dependsOn.get(x.prerequisite_skill_id) || new Set<string>();
    set.add(x.dependent_skill_id);
    dependsOn.set(x.prerequisite_skill_id, set);
  });

  const scoreMap = new Map<string, number>();
  (us.data || []).forEach((r: any) => scoreMap.set(r.skill_id, r.score));

  const rows = roleSkills.map((r: any) => {
    const score = Number(scoreMap.get(r.skill_id) ?? 0);
    const cat = categoryFromScore(score);
    const depSet = dependsOn.get(r.skill_id);
    let bonus = 1;
    if (depSet) {
      for (const dep of depSet) {
        if (roleSkillIds.has(dep)) { bonus = 2; break; }
      }
    }
    const p = priorityScore({ score, roleWeight: Number(r.weight ?? 0.8), dependencyBonus: bonus });
    return {
      user_id: user.id,
      role_id: roleId,
      skill_id: r.skill_id,
      category: cat,
      priority: p,
      status: "todo",
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from("user_roadmap").upsert(rows, { onConflict: "user_id,role_id,skill_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, count: rows.length });
}
