import type { SupabaseClient, User } from "@supabase/supabase-js";

export const ACCOUNT_REQUEST_COLUMNS = "id,status,requested_at,updated_at,staff_account,resolution,resolved_at";
export const DELETION_STATUSES: Record<string, string> = { pending: "Request received", in_review: "Being reviewed", cancelled: "Cancelled by you", closed: "Review closed" };

export function confirmedAccountEmail(value: unknown, verifiedEmail: string | undefined) {
  return typeof value === "string" && !!verifiedEmail && value.trim().toLowerCase() === verifiedEmail.toLowerCase();
}

export function accountRequestInput(body: unknown, admin = false): { action: "request" | "cancel" | "start" | "close"; confirmation?: string; requestId?: string; resolution?: string } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  const allowed = admin ? ["start", "close"] : ["request", "cancel"];
  if (typeof value.action !== "string" || !allowed.includes(value.action) || Object.keys(value).some(key => !["action", "confirmation", "requestId", "resolution"].includes(key))) return null;
  if (value.action === "request") return typeof value.confirmation === "string" && value.confirmation.length <= 254 && value.requestId === undefined && value.resolution === undefined ? { action: "request", confirmation: value.confirmation } : null;
  if (typeof value.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.requestId) || value.confirmation !== undefined) return null;
  if (value.action === "close") return typeof value.resolution === "string" && value.resolution.trim().length >= 20 && value.resolution.trim().length <= 2000 ? { action: "close", requestId: value.requestId, resolution: value.resolution.trim() } : null;
  if (value.resolution !== undefined) return null;
  return { action: value.action as "cancel" | "start", requestId: value.requestId };
}

const EXPORT_TABLES = [
  ["profile", "profiles", "*", "id", "id"],
  ["statistics", "user_stats", "xp,level,streak,last_activity_date,updated_at", "user_id", "user_id"],
  ["skill_scores", "user_skill_scores", "skill_id,score,updated_at", "user_id", "skill_id"],
  ["roadmap", "user_roadmap", "id,role_id,skill_id,category,priority,status,progress,created_at,updated_at", "user_id", "id"],
  ["resource_completions", "user_resource_completions", "resource_id,completed_at", "user_id", "resource_id"],
  ["courses", "roadmap_courses", "id,skill_id,title,type,provider,url,estimated_hours,difficulty,description,sort_order,completed,created_at", "user_id", "id"],
  ["course_assessments", "course_assessments", "id,course_id,score,total,passed,attempt_number,answers,created_at", "user_id", "id"],
  ["practice_attempts", "practice_attempts", "id,score,correct_count,total_count,difficulty_level,skill_scores,created_at", "user_id", "id"],
  ["daily_attempts", "daily_attempts", "id,attempt_date,started_at,completed_at,correct_count,total_count,xp_earned", "user_id", "id"],
  ["career_reflections", "career_reflections", "id,role_id,content,updated_at", "user_id", "id"],
  ["practical_drafts", "practical_projects", "id,role_id,level,brief,content,links,draft_version,created_at,updated_at", "user_id", "id"],
  ["practical_submissions", "practical_submissions", "id,project_id,revision,draft_version,brief,content,links,consented_at,submitted_at,withdrawn_at", "user_id", "id"],
  ["practical_feedback", "practical_reviews", "id,submission_id,verdict,feedback,criteria,created_at", "user_id", "id"],
  ["insights", "ai_insights", "analysis,meta,created_at,updated_at", "user_id", "id"],
  ["account_requests", "account_deletion_requests", ACCOUNT_REQUEST_COLUMNS, "user_id", "id"],
] as const;

const PROFILE_FIELDS = new Set(["id", "email", "full_name", "phone", "course", "onboarded", "target_role_id", "custom_target_role", "future_plans", "strengths", "weaknesses", "previous_academics", "created_at", "updated_at", "user_type", "company", "job_title", "years_experience", "resume_url", "linkedin_url", "current_skills_text", "education_level", "graduation_year", "career_level", "career_focus_skill_ids", "career_goal_context"]);

/** Uses the authenticated RLS client, explicit ownership predicates even for staff,
 * and projections that omit credentials, sealed tokens, other users and staff moderation. */
export async function collectAccountExport(client: SupabaseClient, user: User, now = new Date()) {
  let rowCount = 0;
  let pageBytes = 0;
  const deadline = AbortSignal.timeout(25000);
  async function rows(table: string, columns: string, scope: (query: any) => any, order = "id") {
    const collected: Record<string, unknown>[] = [];
    for (let start = 0; start < 10000; start += 500) {
      let query = scope(client.from(table).select(columns));
      for (const field of order.split(",")) query = query.order(field, { ascending: true });
      query = query.range(start, start + 499).abortSignal(deadline);
      const result = await query;
      if (result.error || !Array.isArray(result.data)) throw new Error("Your complete export could not be prepared. Please try again later.");
      pageBytes += Buffer.byteLength(JSON.stringify(result.data), "utf8");
      if (pageBytes > 12 * 1024 * 1024) throw new Error("This account needs a larger assisted export. Contact support through the privacy notice.");
      rowCount += result.data.length;
      if (rowCount > 10000) throw new Error("This account needs a larger assisted export. Contact support through the privacy notice.");
      collected.push(...result.data);
      if (result.data.length < 500) return collected;
    }
    throw new Error("This account needs a larger assisted export. Contact support through the privacy notice.");
  }
  const data: Record<string, Record<string, unknown>[]> = {};
  for (const [key, table, columns, owner, order] of EXPORT_TABLES) data[key] = await rows(table, columns, query => query.eq(owner, user.id), order);
  data.profile = data.profile.map(profile => Object.fromEntries(Object.entries(profile).filter(([key]) => PROFILE_FIELDS.has(key))));
  const attemptIds = data.daily_attempts.map(row => row.id as string);
  data.daily_answers = []; data.daily_skill_scores = [];
  const conversationRows = await rows("chat_conversations", "id,title,is_ai,created_at", query => query.eq("user_id", user.id));
  data.conversations = conversationRows;
  data.messages = [];
  // These child tables have no user_id: scope them only through owned parents.
  for (let index = 0; index < attemptIds.length; index += 100) {
    const ids = attemptIds.slice(index, index + 100);
    data.daily_answers.push(...await rows("attempt_answers", "id,attempt_id,question_id,selected_index,is_correct,points,skill_id,created_at", query => query.in("attempt_id", ids)));
    data.daily_skill_scores.push(...await rows("attempt_skill_scores", "attempt_id,skill_id,score", query => query.in("attempt_id", ids), "attempt_id,skill_id"));
  }
  for (let index = 0; index < conversationRows.length; index += 100) {
    const ids = conversationRows.slice(index, index + 100).map(row => row.id);
    data.messages.push(...await rows("chat_messages", "id,conversation_id,sender_role,content,created_at", query => query.in("conversation_id", ids).in("sender_role", ["user", "ai"])));
  }
  const result = {
    format: "voidfill-account-export", version: 1, exported_at: now.toISOString(),
    account: { email: user.email || "", created_at: user.created_at, email_confirmed_at: user.email_confirmed_at || null },
    scope: "Your profile, saved learning records, private practical work, feedback shared with you, and your own/AI messages in conversations you own. Mentor-authored chat messages, internal moderation, operational ledgers/logs, login credentials and authentication tokens are excluded. This is an application-data export, not a project backup.",
    data,
  };
  if (Buffer.byteLength(JSON.stringify(result), "utf8") > 12 * 1024 * 1024) throw new Error("This account needs a larger assisted export. Contact support through the privacy notice.");
  return result;
}
