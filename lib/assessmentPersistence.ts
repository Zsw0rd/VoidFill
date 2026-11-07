import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/admin";
import type { gradeAssessment } from "./assessments";
import { LearningError } from "./localMl";
import { persistAssessmentOnce } from "./submissions";
import { persistCloudSubmission } from "./cloudSubmissions";

export type VerifiedGrade = ReturnType<typeof gradeAssessment>;

/** Call only after authenticating the user and decrypting/grading their assessment.
 * The RPC accepts computed scores only from service_role, never a browser client.
 * PostgreSQL commits the ledger and every progress mutation in one transaction.
 */
export async function persistVerifiedAssessment<T>(
  client: SupabaseClient,
  userId: string,
  grade: VerifiedGrade,
  answers: { question_id: string; selected_index: number }[],
  saveDemo: () => Promise<T>,
): Promise<T> {
  const demoToken = (client as any).__demoToken as string | undefined;
  if (demoToken) return persistAssessmentOnce(grade.assessmentId, saveDemo, demoToken, userId);
  return persistCloudSubmission<T>(userId, grade, answers);
}

/** Server-side generated roadmap/resource writes, scoped by the authenticated caller.
 * Callers must supply their auth-derived user ID; never forward arbitrary row input.
 */
export function trustedLearningWriter(client: SupabaseClient): SupabaseClient {
  if ((client as any).__demoToken) return client;
  try { return createAdminClient(); }
  catch { throw new LearningError("Learning storage is not configured."); }
}
