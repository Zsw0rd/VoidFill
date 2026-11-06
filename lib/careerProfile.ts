import { z } from "zod";
import type { createClient } from "@/lib/supabase/server";
import { careerForName, careerSkillForName, MAX_FOCUS_SKILLS, PERSONAL_GOAL_NAME } from "./careerCatalog";
import { LearningError } from "./localMl";

export const careerSelectionSchema = z.object({
  role_id: z.string().uuid(),
  goal: z.string().trim().max(160).default(""),
  level: z.enum(["foundation", "intermediate"]).default("foundation"),
  focus_skill_ids: z.array(z.string().uuid()).max(MAX_FOCUS_SKILLS).default([]),
  context: z.string().trim().max(2000).default(""),
}).strict();

export async function validatedCareerSelection(supabase: Awaited<ReturnType<typeof createClient>>, input: z.infer<typeof careerSelectionSchema>) {
  const {data: role, error} = await supabase.from("roles").select("id,name").eq("id", input.role_id).maybeSingle();
  if (error) throw new LearningError("Could not verify this career profile.", 500);
  if (!role || (!careerForName(role.name) && role.name !== PERSONAL_GOAL_NAME)) throw new LearningError("Choose an available career profile.", 400);
  const focusIds = [...new Set(input.focus_skill_ids)];
  if (focusIds.length) {
    const {data: skills, error: skillError} = await supabase.from("skills").select("id,name").in("id", focusIds);
    if (skillError) throw new LearningError("Could not verify focus skills.", 500);
    if (skills?.length !== focusIds.length || skills.some(skill => !careerSkillForName(skill.name))) throw new LearningError("Choose focus skills from the career catalogue.", 400);
  }
  if (role.name === PERSONAL_GOAL_NAME && (!input.goal || !focusIds.length)) throw new LearningError("Give your personal goal a name and choose at least one focus skill.", 400);
  return {target_role_id: role.id, custom_target_role: input.goal || null, career_level: input.level, career_focus_skill_ids: focusIds, career_goal_context: input.context};
}
