import { mlServiceUrl } from "@/lib/mlServiceUrl";
import { mkdir, open, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { LearningError } from "./localMl";

// Local deployments use an exclusive file claim to prevent a token awarding XP
// twice. Shared/multi-instance hosting needs a transactional database ledger.
export async function persistAssessmentOnce<T>(
  assessmentId: string,
  save: () => Promise<T>,
  demoToken?: string,
  userId?: string,
): Promise<T> {
  if (demoToken) {
    const ledger = async (body: unknown) => {
      const response = await fetch(mlServiceUrl("/guest/ledger"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ML-Token": process.env.ML_SERVICE_TOKEN || "",
          "X-Demo-Token": demoToken,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok)
        throw new LearningError(
          "Demo session ended or unavailable.",
          response.status,
        );
      return result;
    };
    const previous = await ledger({ id: assessmentId, action: "claim" });
    if (previous.status === "completed") return previous.result;
    if (previous.status !== "claimed")
      throw new LearningError(
        "This assessment has already been submitted.",
        409,
      );
    try {
      const result = await save();
      await ledger({ id: assessmentId, action: "completed", result });
      return result;
    } catch (error) {
      await ledger({ id: assessmentId, action: "failed" });
      throw error;
    }
  }
  if (process.env.VERCEL)
    throw new LearningError("Cloud assessment writes require the verified grading transaction.", 500);
  const directory = path.join(process.cwd(), "ml", "runtime", "submissions");
  await mkdir(directory, { recursive: true });
  if (!/^[a-f0-9-]{36}$/i.test(assessmentId))
    throw new LearningError("Invalid assessment ID.", 400);
  const filename = path.join(directory, assessmentId + ".json");
  try {
    const claim = await open(filename, "wx", 0o600);
    await claim.writeFile(JSON.stringify({ status: "pending" }));
    await claim.close();
  } catch (error: any) {
    if (error.code !== "EEXIST") throw error;
    let previous;
    try {
      previous = JSON.parse(await readFile(filename, "utf8"));
    } catch {
      /* another request is writing */
    }
    if (previous?.status === "completed") return previous.result as T;
    throw new LearningError(
      previous?.status === "failed"
        ? "This assessment could not be saved completely. Refresh your progress before starting another test."
        : "This assessment is already being submitted. Please wait.",
      409,
    );
  }
  try {
    const result = await save();
    await writeFile(filename, JSON.stringify({ status: "completed", result }), {
      mode: 0o600,
    });
    return result;
  } catch (error) {
    await writeFile(filename, JSON.stringify({ status: "failed" }), {
      mode: 0o600,
    });
    throw error;
  }
}
