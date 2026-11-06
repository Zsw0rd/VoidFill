"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, PenLine } from "lucide-react";
import { CareerPicker, type AvailableSkill, type CareerChoice } from "@/components/careers/CareerPicker";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { careerCatalogue, careerForName, PERSONAL_GOAL_NAME, type StoredCareer } from "@/lib/careerCatalog";

export function CareerExplorer({roles, skills, profile, reflections}: {roles: StoredCareer[]; skills: AvailableSkill[]; profile: any; reflections: {role_id: string; content: string}[]}) {
  const router = useRouter();
  const [choice, setChoice] = useState<CareerChoice>({roleId: profile.target_role_id || "", goal: profile.custom_target_role || "", level: profile.career_level === "intermediate" ? "intermediate" : "foundation", focusIds: profile.career_focus_skill_ids || [], context: profile.career_goal_context || ""});
  const [notes, setNotes] = useState<Record<string, string>>(Object.fromEntries(reflections.map(note => [note.role_id, note.content])));
  const [busy, setBusy] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const saving = useRef(false);
  const savingNote = useRef(false);
  const selected = roles.find(role => role.id === choice.roleId);
  const career = careerForName(selected?.name);
  const personal = selected?.name === PERSONAL_GOAL_NAME;
  async function save() {
    if (saving.current) return;
    if (!choice.roleId || (personal && (!choice.goal.trim() || !choice.focusIds.length))) return toast("Complete your direction", "Choose a profile, or name a personal goal and select focus skills.");
    saving.current = true; setBusy(true);
    try {
      const res = await fetch("/api/careers/profile", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({role_id: choice.roleId, goal: choice.goal, level: choice.level, focus_skill_ids: choice.focusIds, context: choice.context})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Please try again.");
      toast("Direction saved", "Your atlas and learning activities now use this profile. Your earned progress is kept."); router.refresh();
    } catch (error) {toast("Could not save", error instanceof Error ? error.message : "Please try again.");}
    finally {saving.current = false; setBusy(false);}
  }
  async function saveNote() {
    if (!selected || savingNote.current) return;
    const roleId = selected.id;
    savingNote.current = true; setNoteBusy(true);
    try {
      const res = await fetch("/api/careers/reflection", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({role_id: roleId, content: notes[roleId] || ""})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Please try again.");
      toast("Reflection saved", "Your private, ungraded note is saved for this career profile.");
    } catch (error) {toast("Could not save reflection", error instanceof Error ? error.message : "Please try again.");}
    finally {savingNote.current = false; setNoteBusy(false);}
  }
  return <div className="max-w-6xl mx-auto">
    <div className="mb-7 flex flex-wrap justify-between items-end gap-4"><div><p className="eyebrow mb-3">Many fields. Your own direction.</p><h1 className="page-title">A career worth exploring.</h1><p className="mt-3 text-sm text-muted max-w-2xl">60 profiles across technical and non-technical fields. Start with a foundation, add focus skills, and build evidence through practice.</p></div><Link href="/roadmap" className="secondary-link">Open your atlas <ArrowUpRight size={15} /></Link></div>
    <div className="career-explorer-layout"><div className="career-explorer-panel"><CareerPicker roles={roles} skills={skills} value={choice} onChange={setChoice} disabled={busy} /><div className="career-explorer-save"><Button onClick={save} disabled={busy || !choice.roleId}>{busy ? "Saving direction…" : "Save my direction"}</Button><p>Changing direction keeps your scores, XP and activity history.</p></div></div>
      <aside className="career-explorer-side career-explorer-panel career-activity" aria-label="Practical career activity"><p className="eyebrow !mt-0 mb-3"><PenLine size={14} className="inline mr-1" /> Put it into practice</p><h2>{career?.activity.title || (personal ? "Make your goal concrete" : "Choose a career to begin")}</h2><p>{career?.activity.instructions || (personal ? "Create a small example of the work you want to do using your selected focus skills. Explain the intended audience, your approach and what you would improve after feedback." : "Preview a practical activity and its review criteria alongside each profile.")}</p>{career && <><ol>{career.activity.rubric.map(item => <li key={item}>{item}</li>)}</ol><p>{career.activity.note}</p></>}{selected && <div className="mt-6"><label htmlFor="career-reflection" className="text-xs font-semibold">Your private reflection</label><textarea id="career-reflection" className="career-reflection" maxLength={10000} value={notes[selected.id] || ""} onChange={event => setNotes({...notes, [selected.id]: event.target.value})} placeholder="What did you produce? What evidence supports your choices? What would you improve?" disabled={noteBusy} /><p className="!text-[10px] !mt-2">Ungraded notes do not award XP or skill scores. They are private to your account.</p><Button variant="soft" className="mt-4" onClick={saveNote} disabled={noteBusy}>{noteBusy ? "Saving reflection…" : "Save reflection"}</Button></div>}</aside>
    </div><p className="career-catalogue-credit">12 pilot foundations include knowledge checks and linked resources. Other profiles show their current coverage explicitly. These learning activities do not certify professional competence or replace qualifications. Occupation references use <a href="https://www.onetcenter.org/database.html" target="_blank" rel="noopener noreferrer">O*NET 31.0</a> under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>; VoidFill authored the learning mappings and activities. Catalogue {careerCatalogue.version}.</p>
  </div>;
}
