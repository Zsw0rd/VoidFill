"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type AssessmentDraft, type AssessmentPurpose, type DraftSlot, bindAssessmentDraftOwner, browserDraftStorage, readAssessmentDraft, recoveredAssessmentAnswers, removeAssessmentDraft, saveAssessmentDraft } from "@/lib/assessmentDrafts";

export type ResumedAssessment = {
  purpose: AssessmentPurpose; expires_at: number; difficulty: number;
  questions: { id: string; prompt: string; options: string[]; difficulty: number; skill_name: string }[];
  target?: { skillId: string; skillName: string; course?: { id: string; title: string } };
};
type Options = {
  ownerId: string; contextKey: string; slot: DraftSlot; disabled?: boolean;
  onRestore: (session: ResumedAssessment, draft: AssessmentDraft) => void;
};

export function useAssessmentDraft({ ownerId, contextKey, slot, disabled = false, onRestore }: Options) {
  const restore = useRef(onRestore); restore.current = onRestore;
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(false);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const sequence = useRef(0);

  const discard = useCallback(() => {
    ++sequence.current;
    const storage = browserDraftStorage();
    if (storage) removeAssessmentDraft(storage, slot);
    setExpiresAt(0); setMessage(""); setRetry(false); setReady(true);
  }, [slot]);

  useEffect(() => {
    const version = ++sequence.current;
    const controller = new AbortController();
    setReady(false); setRetry(false); setMessage("");
    const storage = browserDraftStorage();
    if (!storage || !bindAssessmentDraftOwner(storage, ownerId)) { setStorageAvailable(false); setReady(true); return; }
    if (disabled) { removeAssessmentDraft(storage, slot); setReady(true); return; }
    const { draft, discarded } = readAssessmentDraft(storage, slot, ownerId, contextKey);
    if (!draft) {
      if (discarded) setMessage("The previous draft expired or no longer matches your learning direction. Start a new assessment when you’re ready.");
      setReady(true); return;
    }
    setMessage("Checking your saved assessment…");
    void (async () => {
      try {
        const response = await fetch("/api/assessments/resume", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: draft.purpose, assessment_token: draft.token }), cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
        const session = await response.json();
        if (controller.signal.aborted || version !== sequence.current) return;
        if (!response.ok) {
          if ([400, 401, 403, 404, 409].includes(response.status)) {
            removeAssessmentDraft(storage, slot); setMessage(session.error || "This draft is no longer available. Start a new assessment."); setReady(true);
          } else { setMessage("Your saved answers are still in this tab. We couldn’t restore the assessment yet. Retry, or discard it to start again."); setRetry(true); }
          return;
        }
        if (!session.questions?.length || !Number.isFinite(session.expires_at) || session.expires_at <= Date.now() || session.purpose !== draft.purpose) throw new Error("Invalid restored session");
        const safeDraft = { ...draft, expiresAt: session.expires_at, index: Math.min(draft.index, session.questions.length - 1), answers: recoveredAssessmentAnswers(draft.answers, session.questions) };
        setExpiresAt(session.expires_at);
        restore.current(session, safeDraft);
        setMessage("Your assessment and selected answers were restored in this tab."); setReady(true);
      } catch {
        if (!controller.signal.aborted && version === sequence.current) { setMessage("Your saved answers are still in this tab. We couldn’t restore the assessment yet. Retry, or discard it to start again."); setRetry(true); }
      }
    })();
    return () => { controller.abort(); };
  }, [contextKey, disabled, ownerId, restoreAttempt, slot]);

  const persist = useCallback((draft: Omit<AssessmentDraft, "version" | "ownerId" | "contextKey">) => {
    if (draft.expiresAt <= Date.now()) return;
    const storage = browserDraftStorage();
    if (!storage || !saveAssessmentDraft(storage, slot, { ...draft, version: 1, ownerId, contextKey })) setStorageAvailable(false);
  }, [contextKey, ownerId, slot]);

  useEffect(() => {
    if (!expiresAt) return;
    const remaining = expiresAt - Date.now();
    const expire = () => {
      const storage = browserDraftStorage(); if (storage) removeAssessmentDraft(storage, slot);
      setMessage("This assessment has expired. Your saved progress is safe; discard this draft and start a new assessment.");
    };
    if (remaining <= 0) { expire(); return; }
    const timer = setTimeout(expire, remaining);
    return () => clearTimeout(timer);
  }, [expiresAt, slot]);

  return { ready, message, retry, storageAvailable, expiresAt, expired: expiresAt > 0 && expiresAt <= Date.now(), setExpiresAt, persist, discard, retryRestore: () => setRestoreAttempt(value => value + 1) };
}
