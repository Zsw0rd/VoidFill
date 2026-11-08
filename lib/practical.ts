import { z } from "zod";
import { careerCatalogue, careerForName, type CareerLevel } from "./careerCatalog";

export const PRACTICAL_CONTENT_LIMIT = 12000;
export const practicalLevels = ["foundation", "intermediate"] as const;
export const practicalLinkSchema = z.string().trim().max(2000).transform((value, context) => {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".") || /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname)) throw new Error();
    return url.href;
  } catch {
    context.addIssue({code: "custom", message: "Use a public HTTPS link without a password."});
    return z.NEVER;
  }
});

const saveSchema = z.object({
  action: z.literal("save"), project_id: z.string().uuid().optional(), expected_version: z.number().int().min(0),
  role_id: z.string().uuid(), level: z.enum(practicalLevels),
  content: z.string().trim().max(PRACTICAL_CONTENT_LIMIT), links: z.array(practicalLinkSchema).max(3),
}).strict();
const submitSchema = z.object({
  action: z.literal("submit"), project_id: z.string().uuid(), expected_version: z.number().int().min(1),
  mentor_id: z.string().uuid(), consent: z.literal(true), request_id: z.string().uuid(),
}).strict();
const withdrawSchema = z.object({action: z.literal("withdraw"), submission_id: z.string().uuid()}).strict();
export const rubricJudgements = ["demonstrated", "developing", "not_yet"] as const;
export const practicalReviewSchema = z.object({
  action: z.literal("review"), submission_id: z.string().uuid(), verdict: z.enum(["ready", "revise"]),
  feedback: z.string().trim().min(10).max(6000),
  criteria: z.array(z.object({criterion: z.number().int().min(0).max(19), judgement: z.enum(rubricJudgements), comment: z.string().trim().max(1200)}).strict()).min(1).max(20),
}).strict();
export const practicalMutationSchema = z.discriminatedUnion("action", [saveSchema, submitSchema, withdrawSchema, practicalReviewSchema]);
export type PracticalMutation = z.infer<typeof practicalMutationSchema>;
export type PracticalReviewInput = z.infer<typeof practicalReviewSchema>;
export type PracticalBrief = {
  version: string; role_id: string; role_name: string; role_key: string; level: CareerLevel;
  title: string; instructions: string; deliverable: string; rubric: string[]; note: string;
  case_inputs?: string[];
};
export type PracticalProject = {
  id: string; user_id: string; role_id: string; level: CareerLevel; brief: PracticalBrief;
  content: string; links: string[]; draft_version: number; created_at: string; updated_at: string;
};
export type PracticalSubmission = {
  id: string; project_id: string; user_id: string; learner_name: string; revision: number; draft_version: number;
  brief: PracticalBrief; content: string; links: string[]; mentor_id: string | null; mentor_name: string;
  assignment_id: string | null; consented_at: string; submitted_at: string; withdrawn_at: string | null;
};
export type PracticalReview = {
  id: string; submission_id: string; user_id: string; mentor_id: string | null; mentor_name: string;
  verdict: "ready" | "revise"; feedback: string; criteria: PracticalReviewInput["criteria"]; created_at: string;
};
export type PracticalWorkspace = {
  projects: PracticalProject[]; submissions: PracticalSubmission[]; reviews: PracticalReview[];
  mentor: {id: string; name: string} | null; demo: boolean; available: boolean;
};

/** A submitted copy keeps this brief forever; catalogue updates never change an existing review. */
export function practicalBrief(roleId: string, level: CareerLevel): PracticalBrief | undefined {
  const role = careerCatalogue.roles.find(item => item.id === roleId);
  if (!role) return;
  // Older catalogue snapshots remain readable while the additive curriculum is deployed.
  const curriculum = role.curriculum?.[level];
  const capstone = curriculum?.milestones.at(-1);
  return {
    version: role.curriculum?.case_pack_version ? `${careerCatalogue.version}/${role.curriculum.case_pack_version}` : careerCatalogue.version, role_id: role.id, role_name: role.name, role_key: role.key, level,
    title: role.activity.title, instructions: role.activity.instructions,
    deliverable: capstone?.deliverable || role.activity.evidence_type,
    rubric: [...(capstone?.checks.length ? capstone.checks : role.activity.rubric), ...(curriculum?.case_verification ? [curriculum.case_verification] : [])].slice(0, 20),
    ...(curriculum?.case_inputs?.length ? {case_inputs: [...curriculum.case_inputs]} : {}),
    note: role.activity.note,
  };
}

/** Production keeps existing role UUIDs by name; catalogue UUIDs also serve demos.
 * A database-bound project must carry the stored UUID, including inside its brief.
 */
export function practicalBriefForStoredRole(role: {id: string; name: string}, level: CareerLevel): PracticalBrief | undefined {
  const catalogueRole = careerForName(role.name);
  const brief = catalogueRole && practicalBrief(catalogueRole.id, level);
  return brief ? {...brief, role_id: role.id} : undefined;
}

export function validatePracticalReview(input: PracticalReviewInput, rubric: string[]) {
  if (input.criteria.length !== rubric.length || new Set(input.criteria.map(item => item.criterion)).size !== rubric.length || input.criteria.some(item => item.criterion >= rubric.length)) return "Review every criterion exactly once.";
  if (input.verdict === "ready" && input.criteria.some(item => item.judgement !== "demonstrated")) return "Mark work ready only when every criterion is demonstrated.";
  return null;
}

/** Pure ownership predicate also used by synthetic demos and permission tests. */
export function canReviewPractical(submission: Pick<PracticalSubmission, "mentor_id" | "assignment_id" | "user_id" | "withdrawn_at">, actor: {id: string; role: string | null}, assignment: {id: string; mentor_id: string; user_id: string} | null) {
  return ["mentor", "admin", "super_admin"].includes(actor.role || "") && !submission.withdrawn_at && !!assignment && submission.mentor_id === actor.id && assignment.mentor_id === actor.id && assignment.user_id === submission.user_id && submission.assignment_id === assignment.id;
}
