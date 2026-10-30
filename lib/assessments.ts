import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { LearningError, localQuestionSchema, type LocalQuestion } from "./localMl";

const metadataSchema = z.object({
  purpose: z.enum(["daily", "practice", "course", "skill"]),
  difficulty: z.number().int().min(1).max(5),
  courseId: z.string().uuid().optional(),
  skillId: z.string().uuid().optional(),
});
const sessionSchema = z.object({
  version: z.literal(1), id: z.string().uuid(), userId: z.string().uuid(),
  expiresAt: z.number(), metadata: metadataSchema, questions: z.array(localQuestionSchema).min(1).max(20),
});
export const submissionSchema = z.object({
  assessment_token: z.string().min(30).max(300000),
  answers: z.array(z.object({ question_id: z.string().min(1).max(100), selected_index: z.number().int().min(-1).max(5) })).min(1).max(20),
});
type Metadata = z.infer<typeof metadataSchema>;

function key() {
  const secret = process.env.ML_ASSESSMENT_SECRET || process.env.ML_SERVICE_TOKEN;
  if (!secret || secret.length < 32) throw new LearningError("Assessment signing is not configured.");
  return createHash("sha256").update(`voidfill-assessment-v1:${secret}`).digest();
}

export function createAssessment(userId: string, questions: LocalQuestion[], metadata: Metadata) {
  const session = sessionSchema.parse({ version: 1, id: randomUUID(), userId, expiresAt: Date.now() + 2 * 60 * 60 * 1000, metadata, questions });
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  const assessment_token = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
  return {
    assessment_token,
    questions: questions.map(({ correct_index, explanation, ...publicQuestion }) => publicQuestion),
  };
}

export function gradeAssessment(userId: string, input: z.infer<typeof submissionSchema>, purpose: Metadata["purpose"]) {
  let session: z.infer<typeof sessionSchema>;
  try {
    const encrypted = Buffer.from(input.assessment_token, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), encrypted.subarray(0, 12));
    decipher.setAuthTag(encrypted.subarray(12, 28));
    const payload = Buffer.concat([decipher.update(encrypted.subarray(28)), decipher.final()]).toString("utf8");
    session = sessionSchema.parse(JSON.parse(payload));
  } catch {
    throw new LearningError("This assessment is invalid or has expired. Please start another test.", 400);
  }
  if (session.userId !== userId || session.metadata.purpose !== purpose || session.expiresAt <= Date.now()) {
    throw new LearningError("This assessment is invalid or has expired. Please start another test.", 400);
  }
  const answers = new Map(input.answers.map((a) => [a.question_id, a.selected_index]));
  if (answers.size !== input.answers.length || answers.size !== session.questions.length || session.questions.some((q) => !answers.has(q.id))) {
    throw new LearningError("Submit exactly one answer for every question in this assessment.", 400);
  }
  const skills = new Map<string, { skill_id: string; skill_name: string; correct: number; total: number; score: number }>();
  let correct = 0;
  const review = session.questions.map((question) => {
    const selected = answers.get(question.id)!;
    if (selected >= question.options.length) throw new LearningError("Invalid answer option.", 400);
    const is_correct = selected === question.correct_index;
    if (is_correct) correct++;
    const skill = skills.get(question.skill_id) || { skill_id: question.skill_id, skill_name: question.skill_name, correct: 0, total: 0, score: 0 };
    skill.total++;
    if (is_correct) skill.correct++;
    skill.score = Math.round(skill.correct / skill.total * 100);
    skills.set(question.skill_id, skill);
    return { id: question.id, correct_index: question.correct_index, explanation: question.explanation, is_correct };
  });
  return { assessmentId: session.id, metadata: session.metadata, correct, total: session.questions.length, score: Math.round(correct / session.questions.length * 100), skills: Array.from(skills.values()), review };
}
