"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, ClipboardList, FileText, LockKeyhole, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CareerLevel } from "@/lib/careerCatalog";
import { PracticalCaseInputs } from "@/components/practical-case-inputs";
import type { PracticalBrief, PracticalSubmission, PracticalWorkspace } from "@/lib/practical";

type Choice = {id: string; name: string; foundation: PracticalBrief; intermediate: PracticalBrief};
const date = (value: string) => new Date(value).toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"});
async function change(body: unknown) {
  const response = await fetch("/api/practical", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not save practical work.");
  return result;
}
export function PracticalStudio({initial, choices, initialRole, initialLevel}: {initial: PracticalWorkspace; choices: Choice[]; initialRole: string; initialLevel: CareerLevel}) {
  const [workspace, setWorkspace] = useState(initial);
  const [roleId, setRoleId] = useState(choices.some(role => role.id === initialRole) ? initialRole : choices[0].id);
  const [level, setLevel] = useState<CareerLevel>(initialLevel);
  const project = workspace.projects.find(item => item.role_id === roleId && item.level === level);
  const [content, setContent] = useState(project?.content || "");
  const [links, setLinks] = useState(project?.links.join("\n") || "");
  const [dirty, setDirty] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [opened, setOpened] = useState<string | null>(null);
  const choice = choices.find(role => role.id === roleId)!;
  const brief = project?.brief || choice[level];
  const history = workspace.submissions.filter(item => item.project_id === project?.id);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) {event.preventDefault(); event.returnValue = "";} };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function select(nextRole: string, nextLevel: CareerLevel) {
    if (dirty) {setError("Save your draft before changing activities."); return;}
    const existing = workspace.projects.find(item => item.role_id === nextRole && item.level === nextLevel);
    setRoleId(nextRole); setLevel(nextLevel); setContent(existing?.content || ""); setLinks(existing?.links.join("\n") || ""); setConsent(false); setError(""); setMessage(""); setOpened(null);
  }
  async function refresh() {
    const response = await fetch("/api/practical", {cache: "no-store"});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not refresh practical work.");
    setWorkspace(result);
  }
  async function save() {
    setBusy("save"); setError(""); setMessage("");
    try {
      const result = await change({action: "save", ...(project ? {project_id: project.id} : {}), expected_version: project?.draft_version || 0, role_id: roleId, level, content, links: links.split("\n").map(link => link.trim()).filter(Boolean)});
      setWorkspace(current => ({...current, projects: [result.project, ...current.projects.filter(item => item.id !== result.project.id)]}));
      setContent(result.project.content); setLinks(result.project.links.join("\n")); setDirty(false); setConsent(false); setMessage("Draft saved privately. Your mentor has not received this version.");
    } catch (issue) {setError(issue instanceof Error ? issue.message : "Could not save your draft.");}
    finally {setBusy("");}
  }
  async function submit() {
    if (!project || !workspace.mentor) return;
    setBusy("submit"); setError(""); setMessage("");
    try {
      await change({action: "submit", project_id: project.id, expected_version: project.draft_version, mentor_id: workspace.mentor.id, consent: true, request_id: crypto.randomUUID()});
      setConsent(false); await refresh(); setMessage("Saved evidence shared with your assigned mentor for review.");
    } catch (issue) {setError(issue instanceof Error ? issue.message : "Could not share this version.");}
    finally {setBusy("");}
  }
  async function withdraw(submission: PracticalSubmission) {
    setBusy(submission.id); setError(""); setMessage("");
    try {await change({action: "withdraw", submission_id: submission.id}); await refresh(); setMessage("Sharing withdrawn. This version and its feedback remain in your private history.");}
    catch (issue) {setError(issue instanceof Error ? issue.message : "Could not withdraw sharing.");}
    finally {setBusy("");}
  }

  return <div className="practical-studio">
    <Link href="/roadmap" className="practical-back"><ArrowLeft size={15} /> Back to your atlas</Link>
    <header className="practical-heading"><div><p className="practical-eyebrow">FIELDWORK / LEARN BY DOING</p><h1>Turn learning into something real.</h1><p>Build a small piece of work, explain your choices, and improve it with mentor feedback.</p></div><span className="practical-stamp"><ClipboardList size={23} /> YOUR WORK<br />YOUR PROGRESS</span></header>
    {!workspace.available ? <section className="practical-notice" role="status"><h2>Practical work is being prepared</h2><p>Your existing learning and private reflections are available. This workspace will open once its database update is applied.</p><Link href="/careers" className="primary-link">Explore career activities</Link></section> : <>
      {workspace.demo && <p className="practical-notice">Disposable preview: work stays in this demo session. Live mentor sharing needs an assigned mentor.</p>}
      <div className="practical-selection"><label htmlFor="practical-career">Your activity<select id="practical-career" value={roleId} onChange={event => select(event.target.value, level)}>{choices.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><label htmlFor="practical-level">Learning stage<select id="practical-level" value={level} onChange={event => select(roleId, event.target.value as CareerLevel)}><option value="foundation">Foundation</option><option value="intermediate">Intermediate</option></select></label><p>Trying an activity does not change your selected career.</p></div>
      <div className="practical-layout"><aside className="practical-brief"><span className="practical-chip">THE BRIEF · {level.toUpperCase()}</span><h2>{brief.title}</h2><p className="practical-instructions">{brief.instructions}</p><PracticalCaseInputs inputs={brief.case_inputs} /><div className="practical-deliverable"><FileText size={18} /><div><h3>What to produce</h3><p>{brief.deliverable}</p></div></div><h3>Review checklist</h3><ol className="practical-checklist">{brief.rubric.map((criterion, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span>{criterion}</li>)}</ol><p className="practical-fineprint">{brief.note}</p><p className="practical-fineprint">Brief {brief.version}. Submitted copies keep this rubric, even when the curriculum changes.</p></aside>
        <section className="practical-editor" aria-labelledby="evidence-heading"><div className="practical-section-heading"><div><p className="practical-eyebrow">YOUR WORKBENCH</p><h2 id="evidence-heading">Show your thinking.</h2></div><span className="practical-chip"><LockKeyhole size={13} /> {dirty ? "Unsaved changes" : "Private draft"}</span></div><p>Describe your work, decisions, results and what you would improve. Use fictional or anonymized examples.</p><label className="practical-field" htmlFor="practical-evidence"><span id="practical-evidence-label">Evidence and explanation</span><textarea id="practical-evidence" aria-labelledby="practical-evidence-label" aria-describedby="practical-evidence-help" rows={12} maxLength={12000} value={content} onChange={event => {setContent(event.target.value); setDirty(true); setConsent(false);}} placeholder="What did you create? Why did you choose this approach? What happened, and what would you change?" /><span id="practical-evidence-help" className="practical-field-hint">{content.length.toLocaleString()} / 12,000 characters · at least 40 to share</span></label><label className="practical-field" htmlFor="practical-links"><span id="practical-links-label">Project links <span className="font-normal text-muted">(optional)</span></span><textarea id="practical-links" aria-labelledby="practical-links-label" rows={3} value={links} onChange={event => {setLinks(event.target.value); setDirty(true); setConsent(false);}} placeholder="https://example.com/your-project" aria-describedby="practical-link-help" /><span id="practical-link-help" className="practical-field-hint">Up to 3 public HTTPS links, one per line. Check link permissions before sharing. VoidFill does not copy linked files.</span></label><div className="practical-save-row"><Button onClick={save} loading={busy === "save"} disabled={!!busy || (!dirty && !!project)}>Save private draft</Button><span>{project ? `Saved ${date(project.updated_at)}` : "Only you can see your draft"}</span></div>
          <div className="practical-sharing"><ShieldCheck size={22} /><div><h3>Ready for a second pair of eyes?</h3>{workspace.mentor ? <><p>Share a saved copy with <strong>{workspace.mentor.name}</strong>. Draft edits stay private until you share another version.</p><label className="practical-consent"><input type="checkbox" checked={consent} disabled={dirty || !project || !!busy} onChange={event => setConsent(event.target.checked)} />I agree to share this evidence, its links and this rubric with my currently assigned mentor.</label><Button variant="soft" onClick={submit} loading={busy === "submit"} disabled={!!busy || !consent || dirty || !project || content.trim().length < 40}><Send size={15} /> Share for review</Button>{dirty && <p className="practical-field-hint">Save and review your changes before sharing.</p>}</> : <p>No mentor is assigned yet. You can keep building privately; an administrator can arrange an assignment. Nothing is shared automatically.</p>}</div></div>
          <p className="practical-fineprint">Practical feedback is separate from quiz scores and XP. A positive review applies to this activity; it is not a professional qualification. Private Career explorer reflections are never imported here.</p>
        </section></div>
      <div aria-live="polite" className="practical-messages">{message && <p role="status" className="practical-success"><CheckCircle2 size={17} />{message}</p>}{error && <p role="alert" className="practical-error">{error}</p>}</div>
      <section className="practical-history"><div className="practical-section-heading"><div><p className="practical-eyebrow">THE ITERATION LOG</p><h2>Every version tells a story.</h2></div><span className="practical-chip">{history.length} shared {history.length === 1 ? "version" : "versions"}</span></div>{history.length === 0 ? <p className="practical-empty">Your shared versions and mentor feedback will appear here. Your draft stays above, ready when you are.</p> : history.map(submission => {
        const review = workspace.reviews.find(item => item.submission_id === submission.id);
        return <article className="practical-history-item" key={submission.id}><button className="practical-history-toggle" aria-expanded={opened === submission.id} onClick={() => setOpened(opened === submission.id ? null : submission.id)}><span><strong>Version {submission.revision}</strong><small>{date(submission.submitted_at)} · {submission.mentor_name}</small></span><span className={`practical-status ${review?.verdict === "ready" ? "is-ready" : ""}`}>{submission.withdrawn_at ? "Sharing withdrawn" : review?.verdict === "ready" ? "Reviewed · ready" : review ? "Feedback to apply" : "Awaiting feedback"}</span></button>{opened === submission.id && <div className="practical-history-body"><p className="practical-evidence-copy">{submission.content}</p>{submission.links.map(link => <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="practical-project-link">{link}<ArrowUpRight size={14} /></a>)}{review && <section className="practical-feedback"><h3>{review.mentor_name}’s feedback</h3><p className="practical-evidence-copy">{review.feedback}</p><ol>{review.criteria.map(item => <li key={item.criterion}><strong>{submission.brief.rubric[item.criterion]}</strong><span className="practical-field-hint">{item.judgement.replaceAll("_", " ")}</span>{item.comment && <p>{item.comment}</p>}</li>)}</ol><p className="practical-field-hint">Reviewed {date(review.created_at)}. Apply feedback in your private draft, save, then share a new version.</p></section>}{!submission.withdrawn_at && <Button variant="ghost" onClick={() => withdraw(submission)} disabled={!!busy} loading={busy === submission.id}>Withdraw mentor access to this version</Button>}</div>}</article>;
      })}</section>
    </>}
  </div>;
}
