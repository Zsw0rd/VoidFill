import { createClient } from "@supabase/supabase-js";
import { LearningError } from "./localMl";

export async function persistCloudSubmission<T>(
  id: string,
  userId: string,
  save: () => Promise<T>,
) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !userId)
    throw new LearningError("Cloud assessment storage is not configured.");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.rpc("vf_claim_submission", {
    p_id: id,
    p_user_id: userId,
  });
  if (error) throw new LearningError("Could not prepare assessment storage.");
  if (data.status === "completed") return data.result as T;
  if (data.status !== "claimed")
    throw new LearningError(
      data.status === "failed"
        ? "This assessment could not be saved completely. Refresh your progress before starting another test."
        : "Another assessment is being saved. Please wait and submit again.",
      409,
    );
  try {
    const result = await save();
    const saved = await db
      .from("vf_submission_ledger")
      .update({ status: "completed", result })
      .eq("id", id)
      .eq("user_id", userId);
    if (saved.error)
      throw new LearningError("Could not finalize assessment storage.");
    return result;
  } catch (error) {
    await db
      .from("vf_submission_ledger")
      .update({ status: "failed" })
      .eq("id", id)
      .eq("user_id", userId);
    throw error;
  }
}
