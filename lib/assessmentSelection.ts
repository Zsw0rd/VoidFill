import type { SupabaseClient } from "@supabase/supabase-js";
import { LearningError, RESOURCE_ASSESSMENT_UNAVAILABLE_MESSAGE, type LearningSkill } from "@/lib/localMl";

/** Bind a resource check to the caller's saved resource, not a submitted title/URL. */
export async function loadCourseAssessmentContext(client: SupabaseClient, ownerId: string, courseId: string, configuredSkills: LearningSkill[]) {
  const {data: course, error} = await client.from("roadmap_courses").select("id, skill_id, title, url").eq("id", courseId).eq("user_id", ownerId).maybeSingle();
  if (error) throw new LearningError("Could not load the course.", 500);
  if (!course) throw new LearningError("Course not found.", 404);
  const skills = configuredSkills.filter(skill => skill.id === course.skill_id);
  if (!skills.length) throw new LearningError("This skill is not configured for your current role.", 400);
  let url: URL;
  try { url = new URL(course.url); }
  catch { throw new LearningError(RESOURCE_ASSESSMENT_UNAVAILABLE_MESSAGE, 422); }
  if (url.protocol !== "https:" || url.username || url.password) throw new LearningError(RESOURCE_ASSESSMENT_UNAVAILABLE_MESSAGE, 422);
  return {skills, courseId: course.id as string, courseTitle: course.title as string, resourceUrl: course.url as string};
}
