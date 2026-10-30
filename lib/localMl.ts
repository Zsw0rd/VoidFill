import { z } from "zod";

export const localQuestionSchema = z.object({
  id: z.string().min(1).max(100),
  prompt: z.string().min(1).max(10000),
  options: z.array(z.string().min(1).max(5000)).min(2).max(6),
  correct_index: z.number().int().min(0).max(5),
  explanation: z.string().max(10000),
  skill_id: z.string().uuid(),
  skill_name: z.string().min(1).max(160),
  difficulty: z.number().int().min(1).max(5),
  source_url: z.string().url(),
}).refine((q) => q.correct_index < q.options.length, "Invalid answer key");

export type LocalQuestion = z.infer<typeof localQuestionSchema>;
export type LearningSkill = { id: string; name: string; score: number | null; target: number; importance: number };

export class LearningError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}

export async function callLocalMl<T>(path: "/recommend" | "/assessment" | "/analyze", payload: unknown, schema: z.ZodType<T>): Promise<T> {
  const token = process.env.ML_SERVICE_TOKEN;
  if (!token) throw new LearningError("The learning service is not configured.");
  try {
    const response = await fetch(new URL(path, process.env.ML_SERVICE_URL || "http://127.0.0.1:8010"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-ML-Token": token },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000),
      cache: "no-store",
    });
    if (!response.ok) {
      if (response.status === 422) throw new LearningError("The question bank does not yet cover the selected skills.", 422);
      console.error("Local ML service status:", response.status);
      throw new LearningError("The learning service is currently unavailable. Please try again.");
    }
    return schema.parse(await response.json());
  } catch (error) {
    if (error instanceof LearningError) throw error;
    console.error("Local ML request failed:", error instanceof Error ? error.message : "Unknown error");
    throw new LearningError("The learning service is currently unavailable. Please try again.");
  }
}

export const assessmentResponseSchema = z.object({
  questions: z.array(localQuestionSchema).min(1).max(20),
  difficulty: z.number().int().min(1).max(5),
  difficultyLabel: z.string(),
  model: z.string(),
  unsupported_skills: z.array(z.string()),
});

export const recommendationResponseSchema = z.object({
  model: z.string(),
  unsupported_skills: z.array(z.string()),
  recommendations: z.array(z.object({
    skill_id: z.string().uuid(),
    skill_name: z.string(),
    resources: z.array(z.object({
      id: z.string(), title: z.string(), type: z.enum(["course", "book", "project", "tutorial", "practice"]),
      provider: z.string(), url: z.string().url().refine((url) => url.startsWith("https://")),
      estimated_hours: z.number().nonnegative().nullable(), difficulty: z.enum(["beginner", "intermediate", "advanced"]),
      description: z.string(), similarity: z.number(), source: z.string(),
    })).max(5),
  })),
});
