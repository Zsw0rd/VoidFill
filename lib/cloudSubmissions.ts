import { createAdminClient } from "./supabase/admin";
import { LearningError } from "./localMl";
import type { gradeAssessment } from "./assessments";

/** A grade must come from gradeAssessment after verifying the current user.
 * Only service_role can call the transactional RPC. No partial-write fallback.
 */
export async function persistCloudSubmission<T>(
  userId: string,
  grade: ReturnType<typeof gradeAssessment>,
  answers: { question_id: string; selected_index: number }[],
): Promise<T> {
  let db: ReturnType<typeof createAdminClient>;
  try { db = createAdminClient(); }
  catch { throw new LearningError("Assessment storage is not configured."); }
  const { data, error } = await db.rpc("vf_commit_assessment", {
    p_id: grade.assessmentId,
    p_user_id: userId,
    p_grade: grade,
    p_answers: Object.fromEntries(answers.map(answer => [answer.question_id, answer.selected_index])),
  }).abortSignal(AbortSignal.timeout(15000));
  if (error) {
    console.error("Assessment transaction failed", { code: error.code });
    throw new LearningError("Could not confirm your results. Please retry this submission.", 503);
  }
  if (!data || typeof data !== "object") throw new LearningError("Could not confirm assessment storage.");
  return data as T;
}
