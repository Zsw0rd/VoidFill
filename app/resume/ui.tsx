"use client";
import { useState } from "react";
import Link from "next/link";
import { FileUp, Loader2, Check, FileText } from "lucide-react";

type Parsed = { filename: string; name: string; email: string; phone: string; skills: { name: string; evidence: string }[]; matched_app_skills: { name: string; evidence_skills: string[] }[]; sections: Record<string, string[]>; role_suggestions: { name: string; similarity: number }[]; text: string; pages: number; methods: string[]; warnings: string[]; note: string; model: string };
export function ResumeUI({ profile, roles }: { profile: any; roles: { id: string; name: string }[] }) {
  const [result, setResult] = useState<Parsed | null>(null);
  const [busy, setBusy] = useState(false), [saving, setSaving] = useState(false);
  const [error, setError] = useState(""), [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState(profile?.full_name || "");
  const [role, setRole] = useState(profile?.target_role_id || "");
  const [keepExisting, setKeepExisting] = useState(true);
  const [existingSkills, setExistingSkills] = useState(profile?.current_skills_text || "");
  async function upload(file?: File) {
    if (!file) return;
    setError(""); setSaved(false); setResult(null);
    if (file.size > 5 * 1024 * 1024 || !/\.(pdf|docx)$/i.test(file.name)) { setError("Choose a PDF or DOCX up to 5 MB."); return; }
    setBusy(true);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/resume", { method: "POST", body: form });
      const parsed = await response.json();
      if (!response.ok) throw new Error(parsed.error);
      setResult(parsed); setSelected(parsed.skills.map((s: any) => s.name));
      setName(parsed.name || profile?.full_name || "");
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function apply() {
    setSaving(true); setError("");
    try {
      const previous = keepExisting ? existingSkills.split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean) : [];
      const nextSkills = [...new Set([...previous, ...selected])];
      const response = await fetch("/api/resume", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, skills: nextSkills, ...(role ? { role_id: role } : {}) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setExistingSkills(nextSkills.join(", "));
      setSaved(true);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }
  return <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
    <div><p className="text-xs text-emerald-300 uppercase tracking-widest">Local resume ingestion</p><h1 className="text-3xl font-semibold mt-2">Turn your resume into a starting point</h1><p className="mt-3 text-zinc-400">Upload an ATS resume or a designed PDF/DOCX. Scanned PDFs use local OCR. Review the extraction, then choose what to add to your learning profile.</p></div>
    <label className={`block border-2 border-dashed border-white/15 rounded-2xl p-10 text-center ${busy ? "opacity-60" : "cursor-pointer hover:border-emerald-400/60"}`}>
      {busy ? <Loader2 className="mx-auto animate-spin" /> : <FileUp className="mx-auto text-emerald-300" />}<span className="block mt-3 font-medium">{busy ? "Reading your resume locally…" : "Choose a resume"}</span><span className="block mt-1 text-sm text-zinc-500">PDF or DOCX · up to 5 MB · PDFs up to 12 pages</span>
      <input aria-label="Upload resume" type="file" accept=".pdf,.docx" disabled={busy} className="sr-only" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} />
    </label>
    <p className="text-sm text-zinc-500">The original file and parsed text are held only while processing and reviewing. Only fields you apply are saved to your profile. Resume claims do not award scores or XP.</p>
    {error && <p role="alert" className="rounded-xl p-4 bg-red-500/10 text-red-300">{error}</p>}
    {result && <>
      <section className="rounded-2xl border border-white/10 p-6 space-y-5"><div className="flex gap-3 items-center"><FileText className="text-emerald-300" /><h2 className="text-xl font-medium">Review extracted fields</h2></div>
        <p className="text-xs text-zinc-500">{result.filename} · {result.pages} page(s) · {result.methods.join(", ")}</p>
        <label className="block">Name<input className="block mt-2 w-full p-3 rounded-xl bg-zinc-900" value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label>
        <p className="text-sm text-zinc-400">Contact detected: {[result.email, result.phone].filter(Boolean).join(" · ") || "None"}. Contact details are shown for review and are not applied.</p>
        <div><h3 className="font-medium mb-3">Skill mentions</h3><div className="flex flex-wrap gap-2">{result.skills.map(skill => <label key={skill.name} title={skill.evidence} className="rounded-xl border border-white/10 px-3 py-2 text-sm cursor-pointer"><input className="mr-2 accent-emerald-400" type="checkbox" checked={selected.includes(skill.name)} onChange={e => setSelected(s => e.target.checked ? [...s, skill.name] : s.filter(n => n !== skill.name))} />{skill.name}</label>)}</div>{!result.skills.length && <p className="text-zinc-500">No supported skill mentions found. Add your skills in Profile.</p>}</div>
        {result.matched_app_skills.length > 0 && <p className="text-sm text-zinc-400">Relevant assessment areas: {result.matched_app_skills.map(s => s.name).join(", ")}. Take a baseline test to measure them.</p>}
        <label className="block">Target role<select className="block mt-2 w-full p-3 rounded-xl bg-zinc-900" value={role} onChange={e => setRole(e.target.value)}><option value="">Keep current target</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
        {result.role_suggestions[0] && <p className="text-sm text-zinc-500">Local model’s closest role context: {result.role_suggestions[0].name}. This is a semantic suggestion, not a proficiency prediction.</p>}
        <label className="block text-sm text-zinc-400"><input className="mr-2 accent-emerald-400" type="checkbox" checked={keepExisting} onChange={e => setKeepExisting(e.target.checked)} />Keep skills already in my profile</label>
        <button disabled={saving} onClick={apply} className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black disabled:opacity-50">{saving ? "Saving…" : "Apply reviewed fields"}</button>
        {saved && <div role="status" className="text-emerald-300 flex flex-wrap items-center gap-3"><Check size={18} />Profile updated.<Link href="/daily-test" className="underline">Take a baseline test</Link><Link href="/roadmap" className="underline">Explore roadmap</Link></div>}
      </section>
      {Object.entries(result.sections).filter(([key]) => ["education", "experience", "projects", "certifications"].includes(key)).map(([key, lines]) => <section key={key} className="rounded-2xl border border-white/10 p-6"><h2 className="capitalize font-medium mb-3">{key}</h2><p className="whitespace-pre-wrap text-sm text-zinc-400">{lines.join("\n")}</p></section>)}
      <details className="rounded-2xl border border-white/10 p-6"><summary className="cursor-pointer">Extracted text and evidence</summary><pre className="mt-4 text-sm whitespace-pre-wrap break-words text-zinc-400">{result.text}</pre><ul className="mt-4 text-sm space-y-2">{result.skills.map(s => <li key={s.name}><strong>{s.name}:</strong> {s.evidence}</li>)}</ul></details>
      <div className="text-xs text-zinc-500 space-y-2">{result.warnings.map(w => <p key={w}>{w}</p>)}<p>Career context model: {result.model}. Skill extraction uses explicit mentions; section and contact extraction use local rules.</p></div>
      <button className="text-sm underline text-zinc-400" onClick={() => { setResult(null); setSelected([]); setName(profile?.full_name || ""); setSaved(false); }}>Clear this extraction</button>
    </>}
  </main>;
}
