import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoService } from "@/lib/demo/server";
import { canMentor } from "@/lib/auth/staff";
import { practicalBriefForStoredRole, validatePracticalReview, type PracticalMutation, type PracticalWorkspace } from "./practical";

export class PracticalError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type PracticalClient = Awaited<ReturnType<typeof createClient>>;

export async function loadPracticalWorkspace(client: PracticalClient, actorId: string, mentorMode = false): Promise<PracticalWorkspace> {
  const token = (client as any).__demoToken;
  if (token) return demoService("practical", {action: "load", mode: mentorMode ? "mentor" : "learner"}, token);
  if (mentorMode) {
    const {data, error} = await client.from("admin_users").select("admin_role").eq("id", actorId).maybeSingle();
    if (error) throw new PracticalError("Could not check mentoring access.", 503);
    if (!canMentor(data?.admin_role)) throw new PracticalError("Mentoring access is required.", 403);
  }
  const [projects, submissions, assignment] = await Promise.all([
    mentorMode ? Promise.resolve({data: [], error: null}) : client.from("practical_projects").select("*").eq("user_id", actorId).order("updated_at", {ascending: false}).limit(120),
    mentorMode ? client.from("practical_submissions").select("*").eq("mentor_id", actorId).is("withdrawn_at", null).order("submitted_at", {ascending: false}).limit(200) : client.from("practical_submissions").select("*").eq("user_id", actorId).order("submitted_at", {ascending: false}).limit(200),
    mentorMode ? Promise.resolve({data: null, error: null}) : client.rpc("vf_practical_current_mentor"),
  ]);
  if ([projects.error, submissions.error, assignment.error].some(Boolean)) {
    const unavailable = [projects.error, submissions.error].some(error => error && ["42P01", "PGRST205"].includes(error.code));
    if (unavailable) return {projects: [], submissions: [], reviews: [], mentor: null, demo: false, available: false};
    throw new PracticalError("Could not load practical work. Please retry.", 503);
  }
  const ids = (submissions.data || []).map(row => row.id);
  const reviews = ids.length ? await client.from("practical_reviews").select("*").in("submission_id", ids).order("created_at", {ascending: false}) : {data: [], error: null};
  if (reviews.error) throw new PracticalError("Could not load mentor feedback.", 503);
  return {projects: projects.data || [], submissions: submissions.data || [], reviews: reviews.data || [], mentor: assignment.data || null, demo: false, available: true};
}

export async function mutatePractical(client: PracticalClient, actorId: string, input: PracticalMutation) {
  const payload: any = {...input};
  if (input.action === "save") {
    const {data: role, error} = await client.from("roles").select("id,name").eq("id", input.role_id).maybeSingle();
    if (error) throw new PracticalError("Could not load this career activity.", 503);
    const brief = role && practicalBriefForStoredRole(role, input.level);
    if (!brief) throw new PracticalError("Choose a supported career activity.");
    payload.brief = brief;
  }
  if (input.action === "review") {
    const token = (client as any).__demoToken;
    if (!token) {
      const {data, error} = await client.from("practical_submissions").select("brief").eq("id", input.submission_id).maybeSingle();
      if (error) throw new PracticalError("Could not load this submission.", 503);
      if (!data) throw new PracticalError("Submission unavailable or no longer shared with you.", 403);
      const invalid = validatePracticalReview(input, data.brief.rubric);
      if (invalid) throw new PracticalError(invalid);
    }
  }
  const token = (client as any).__demoToken;
  if (token) return demoService("practical", payload, token);
  const {data, error} = await createAdminClient().rpc("vf_practical_mutate", {p_actor: actorId, p_action: input.action, p_payload: payload});
  if (error) {
    const known = ["VF_PRACTICAL_CONFLICT", "VF_PRACTICAL_FORBIDDEN", "VF_PRACTICAL_INVALID"];
    const prefix = known.find(value => error.message.startsWith(value));
    if (prefix) throw new PracticalError(error.message.slice(prefix.length + 1).trim(), prefix === "VF_PRACTICAL_CONFLICT" ? 409 : prefix === "VF_PRACTICAL_FORBIDDEN" ? 403 : 400);
    console.error("Practical mutation failed", error.code);
    throw new PracticalError("Could not save practical work. Please retry.", 503);
  }
  return data;
}
