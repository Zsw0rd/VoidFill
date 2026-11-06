import { careerSkillForName, MAX_FOCUS_SKILLS, requiredScore, type CareerLevel } from "./careerCatalog";

export type CareerPreferences = {target_role_id?: string | null; career_level?: string | null; career_focus_skill_ids?: string[] | null};
export type LearningRequirement = {skill_id: string; weight: number; required_score?: number | null; essential?: boolean; skills: {name: string}; target: number};

/** Uses stored IDs so existing production accounts and isolated demos share the same rules. */
export async function loadCareerRequirements(supabase: any, profile: CareerPreferences): Promise<LearningRequirement[]> {
  if (!profile.target_role_id) return [];
  const {data, error} = await supabase.from("role_skills").select("skill_id,weight,required_score,essential,skills(name)").eq("role_id", profile.target_role_id);
  if (error) throw new Error("Could not load career requirements.");
  const requirements = [...(data || [])];
  const focusIds = [...new Set(profile.career_focus_skill_ids || [])].slice(0, MAX_FOCUS_SKILLS);
  if (focusIds.length) {
    const {data: focus, error: focusError} = await supabase.from("skills").select("id,name").in("id", focusIds);
    if (focusError) throw new Error("Could not load focus skills.");
    for (const skill of focus || []) {
      if (careerSkillForName(skill.name) && !requirements.some(row => row.skill_id === skill.id))
        requirements.push({skill_id: skill.id, weight: .8, required_score: 70, essential: false, skills: {name: skill.name}});
    }
  }
  const level: CareerLevel = profile.career_level === "intermediate" ? "intermediate" : "foundation";
  return requirements.map(row => ({...row, target: requiredScore(row, level)}));
}
