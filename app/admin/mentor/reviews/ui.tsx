"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, ClipboardCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PracticalReviewInput, PracticalWorkspace } from "@/lib/practical";

const date = (value: string) => new Date(value).toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"});
export function PracticalReviewQueue({initial}: {initial: PracticalWorkspace}) {
  const [workspace, setWorkspace] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial.submissions[0]?.id || "");
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [feedback, setFeedback] = useState("");
  const [criteria, setCriteria] = useState<PracticalReviewInput["criteria"]>([]);
  const [verdict, setVerdict] = useState<"ready" | "revise">("revise");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const reviewed = new Map(workspace.reviews.map(review => [review.submission_id, review]));
  const queue = workspace.submissions.filter(item => filter === "all" || !reviewed.has(item.id));
  const selected = workspace.submissions.find(item => item.id === selectedId) || queue[0];
  const review = selected ? reviewed.get(selected.id) : null;
  const judgements = selected?.brief.rubric.map((_, index) => criteria.find(item => item.criterion === index) || {criterion: index, judgement: "developing" as const, comment: ""}) || [];
  const ready = judgements.length > 0 && judgements.every(item => item.judgement === "demonstrated");
  const pendingCount = workspace.submissions.filter(item => !reviewed.has(item.id)).length;
  const reviewDirty = !review && (!!feedback.trim() || criteria.length > 0);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {if (reviewDirty) {event.preventDefault(); event.returnValue = "";}};
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [reviewDirty]);
  function choose(id: string) {
    if (reviewDirty) {setError("Save your feedback or discard the unsaved review before switching work."); return false;}
    setSelectedId(id); setFeedback(""); setCriteria([]); setVerdict("revise"); setError(""); setMessage(""); return true;
  }
  function updateCriterion(index: number, update: Partial<PracticalReviewInput["criteria"][number]>) {
    setCriteria(judgements.map(item => item.criterion === index ? {...item, ...update} : item));
    if (update.judgement && update.judgement !== "demonstrated") setVerdict("revise");
  }
  async function refresh() {
    if (reviewDirty) {setError("Save your feedback or discard the unsaved review before refreshing."); return;}
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/practical?mode=mentor", {cache: "no-store"});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not refresh the review queue.");
      setWorkspace(result); setSelectedId(""); setFeedback(""); setCriteria([]); setMessage("Review queue refreshed.");
    } catch (issue) {setError(issue instanceof Error ? issue.message : "Could not refresh the review queue.");}
    finally {setBusy(false);}
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || review) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/practical", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({action: "review", submission_id: selected.id, verdict, feedback, criteria: judgements})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save your review.");
      setWorkspace(current => ({...current, reviews: [result.review, ...current.reviews]}));
      setMessage("Feedback saved. The learner can revise their draft and share a new version.");
    } catch (issue) {setError(issue instanceof Error ? issue.message : "Could not save your review.");}
    finally {setBusy(false);}
  }
  return <div className="practical-studio"><Link href="/admin/mentor" className="practical-back"><ArrowLeft size={15} /> Your mentoring circle</Link><header className="practical-heading"><div><p className="practical-eyebrow">FIELDWORK / THE REVIEW DESK</p><h1>Help good work get better.</h1><p>Review evidence learners explicitly shared with your current assignment. Private drafts and reflections stay with the learner.</p></div><span className="practical-stamp"><ClipboardCheck size={24} />{pendingCount} WAITING<br />FOR YOUR EYE</span></header>
    {!workspace.available ? <p className="practical-notice">The practical review workspace will open once its database update is applied.</p> : <>
      {workspace.demo && <p className="practical-notice">Synthetic review examples. Feedback stays inside this disposable session and never contacts a real learner.</p>}
      <div className="practical-section-heading"><div className="practical-filter"><button aria-pressed={filter === "pending"} onClick={() => {if (choose("")) setFilter("pending");}}>Awaiting feedback ({pendingCount})</button><button aria-pressed={filter === "all"} onClick={() => {if (choose("")) setFilter("all");}}>All shared versions</button></div><Button variant="ghost" loading={busy} onClick={refresh}><RefreshCw size={14} /> Refresh</Button></div>
      {queue.length === 0 ? <section className="practical-editor"><h2>A clear review desk.</h2><p className="practical-empty">{filter === "pending" ? "There is no work awaiting feedback. Reviewed versions are available under All shared versions." : "When an assigned learner chooses to share their work with you, it will appear here."}</p></section> : <div className="practical-review-layout"><nav className="practical-queue" aria-label="Shared practical work">{queue.map(item => <button key={item.id} onClick={() => choose(item.id)} aria-current={selected?.id === item.id}><strong>{item.learner_name}</strong><small>{item.brief.role_name} · {item.brief.level}</small><small>Version {item.revision} · {date(item.submitted_at)}</small><small>{reviewed.has(item.id) ? "Reviewed" : "Awaiting feedback"}</small></button>)}</nav>{selected && <article className="practical-editor"><span className="practical-chip">{selected.brief.role_name.toUpperCase()} · {selected.brief.level.toUpperCase()}</span><h2 className="mt-4">{selected.brief.title}</h2><p className="mt-3">{selected.learner_name} · Version {selected.revision} · Shared {date(selected.submitted_at)}</p><h3 className="practical-review-title">Expected deliverable</h3><p>{selected.brief.deliverable}</p><h3 className="practical-review-title">The learner’s evidence</h3><p className="practical-evidence-copy mt-3">{selected.content}</p>{selected.links.map(link => <a className="practical-project-link" key={link} href={link} target="_blank" rel="noopener noreferrer">{link}<ArrowUpRight size={14} /></a>)}<p className="practical-fineprint">External links may change after submission. Review the saved explanation and note any linked evidence you checked. Brief {selected.brief.version}.</p>
        {review ? <section className="practical-feedback"><h3>Feedback recorded · {review.verdict === "ready" ? "Ready for this activity" : "Revision suggested"}</h3><p className="practical-evidence-copy">{review.feedback}</p><ol>{review.criteria.map(item => <li key={item.criterion}><strong>{selected.brief.rubric[item.criterion]}</strong><span className="practical-field-hint">{item.judgement.replaceAll("_", " ")}</span>{item.comment && <p>{item.comment}</p>}</li>)}</ol><p className="practical-field-hint">Saved {date(review.created_at)}. Reviews are preserved; a revision needs a new learner submission.</p></section> : <form onSubmit={submit}><h3 className="practical-review-title mb-4">Review against the saved rubric</h3>{selected.brief.rubric.map((criterion, index) => <fieldset className="practical-criterion" key={`${selected.id}-${index}`}><legend>{index + 1}. {criterion}</legend><label className="sr-only" htmlFor={`judgement-${index}`}>Judgement for criterion {index + 1}</label><select id={`judgement-${index}`} value={judgements[index]?.judgement || "developing"} onChange={event => updateCriterion(index, {judgement: event.target.value as "demonstrated" | "developing" | "not_yet"})}><option value="not_yet">Not yet demonstrated</option><option value="developing">Developing</option><option value="demonstrated">Demonstrated in this work</option></select><label className="sr-only" htmlFor={`criterion-comment-${index}`}>Comment for criterion {index + 1}</label><textarea id={`criterion-comment-${index}`} rows={2} maxLength={1200} value={judgements[index]?.comment || ""} onChange={event => updateCriterion(index, {comment: event.target.value})} placeholder="A specific observation or next step (optional)" /></fieldset>)}<label className="practical-field" htmlFor="practical-review-feedback">Overall feedback<textarea id="practical-review-feedback" rows={5} required minLength={10} maxLength={6000} value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="What worked? What needs attention? Give a concrete next step." /></label><label className="practical-field" htmlFor="practical-review-verdict">Review outcome<select id="practical-review-verdict" className="rounded-lg border border-line bg-paper p-3" value={verdict} onChange={event => setVerdict(event.target.value as "ready" | "revise")}><option value="revise">Suggest a revision</option><option value="ready" disabled={!ready}>Ready for this activity</option></select><span className="practical-field-hint">Ready is available when every criterion is demonstrated. Feedback does not change XP, quiz scores or professional status.</span></label><Button className="mt-5" type="submit" loading={busy} disabled={feedback.trim().length < 10}>Save feedback for the learner</Button></form>}
        <p className="practical-fineprint">Only explicitly shared evidence is visible. A reassignment or withdrawal removes access on subsequent requests.</p></article>}</div>}
      {reviewDirty && <Button className="mt-4" variant="ghost" onClick={() => {setFeedback(""); setCriteria([]); setVerdict("revise"); setError("");}}>Discard this unsaved review</Button>}
      <div className="practical-messages" aria-live="polite">{message && <p role="status" className="practical-success"><CheckCircle2 size={17} />{message}</p>}{error && <p role="alert" className="practical-error">{error}</p>}</div>
    </>}
  </div>;
}
