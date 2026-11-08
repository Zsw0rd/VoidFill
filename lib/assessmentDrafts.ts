import { z } from "zod";

export const ASSESSMENT_DRAFT_PREFIX = "vf-assessment-draft-v1:";
const OWNER_KEY = "vf-assessment-owner-v1";
const MAX_DRAFT_BYTES = 310000;
export type DraftSlot = "daily" | "practice" | "roadmap";
export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const slots: DraftSlot[] = ["daily", "practice", "roadmap"];
const purposeSchema = z.enum(["daily", "practice", "course", "skill"]);
export type AssessmentPurpose = z.infer<typeof purposeSchema>;

const draftSchema = z.object({
  version: z.literal(1), ownerId: z.string().uuid(),
  contextKey: z.string().regex(/^[a-f0-9]{64}$/), purpose: purposeSchema,
  token: z.string().min(30).max(300000).regex(/^[A-Za-z0-9_-]+$/),
  expiresAt: z.number().int().positive(),
  index: z.number().int().min(0).max(19),
  answers: z.record(z.string().min(1).max(100), z.number().int().min(0).max(5)).refine(value => Object.keys(value).length <= 20),
}).strict();
export type AssessmentDraft = z.infer<typeof draftSchema>;

export function clearAssessmentDrafts(storage: DraftStorage) {
  try {
    for (const slot of slots) storage.removeItem(ASSESSMENT_DRAFT_PREFIX + slot);
    storage.removeItem(OWNER_KEY);
    return true;
  } catch { return false; }
}

export function bindAssessmentDraftOwner(storage: DraftStorage, ownerId: string) {
  try {
    if (storage.getItem(OWNER_KEY) !== ownerId) clearAssessmentDrafts(storage);
    storage.setItem(OWNER_KEY, ownerId);
    return true;
  } catch { return false; }
}

export function removeAssessmentDraft(storage: DraftStorage, slot: DraftSlot) {
  try { storage.removeItem(ASSESSMENT_DRAFT_PREFIX + slot); return true; }
  catch { return false; }
}

/** Also remove expired drafts after navigating away from the question page. */
export function pruneExpiredAssessmentDrafts(storage: DraftStorage, now = Date.now()) {
  for (const slot of slots) {
    try {
      const raw = storage.getItem(ASSESSMENT_DRAFT_PREFIX + slot);
      if (!raw) continue;
      const parsed = raw.length <= MAX_DRAFT_BYTES ? draftSchema.safeParse(JSON.parse(raw)) : null;
      if (!parsed?.success || parsed.data.expiresAt <= now) removeAssessmentDraft(storage, slot);
    } catch { removeAssessmentDraft(storage, slot); }
  }
}

function matchingSlot(slot: DraftSlot, purpose: AssessmentPurpose) {
  return slot === "roadmap" ? purpose === "course" || purpose === "skill" : slot === purpose;
}

export function saveAssessmentDraft(storage: DraftStorage, slot: DraftSlot, draft: AssessmentDraft, now = Date.now()) {
  const parsed = draftSchema.safeParse(draft);
  if (!parsed.success || !matchingSlot(slot, draft.purpose) || draft.expiresAt <= now || draft.expiresAt > now + 2 * 60 * 60 * 1000 + 60000) return false;
  try {
    if (!bindAssessmentDraftOwner(storage, draft.ownerId)) return false;
    const encoded = JSON.stringify(parsed.data);
    if (encoded.length > MAX_DRAFT_BYTES) return false;
    storage.setItem(ASSESSMENT_DRAFT_PREFIX + slot, encoded);
    return true;
  } catch { return false; }
}

export function readAssessmentDraft(storage: DraftStorage, slot: DraftSlot, ownerId: string, contextKey: string, now = Date.now()): { draft: AssessmentDraft | null; discarded: boolean } {
  try {
    if (!bindAssessmentDraftOwner(storage, ownerId)) return { draft: null, discarded: false };
    const raw = storage.getItem(ASSESSMENT_DRAFT_PREFIX + slot);
    if (!raw) return { draft: null, discarded: false };
    const parsed = raw.length <= MAX_DRAFT_BYTES ? draftSchema.safeParse(JSON.parse(raw)) : null;
    if (!parsed?.success || parsed.data.ownerId !== ownerId || parsed.data.contextKey !== contextKey || !matchingSlot(slot, parsed.data.purpose) || parsed.data.expiresAt <= now || parsed.data.expiresAt > now + 2 * 60 * 60 * 1000 + 60000) {
      removeAssessmentDraft(storage, slot);
      return { draft: null, discarded: true };
    }
    return { draft: parsed.data, discarded: false };
  } catch {
    removeAssessmentDraft(storage, slot);
    return { draft: null, discarded: true };
  }
}

/** Browser selections never supply prompts, keys or question membership to grading. */
export function recoveredAssessmentAnswers(answers: Record<string, number>, questions: { id: string; options: string[] }[]) {
  return Object.fromEntries(questions.filter(question => Number.isInteger(answers[question.id]) && answers[question.id] >= 0 && answers[question.id] < question.options.length).map(question => [question.id, answers[question.id]]));
}

export function browserDraftStorage(): Storage | null {
  try { return window.sessionStorage; } catch { return null; }
}
