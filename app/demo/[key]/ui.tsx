"use client";
import { useState } from "react";
export function DemoEntry({ entryKey }: { entryKey: string }) {
  const [role, setRole] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/demo/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: entryKey, role }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.assign("/resume");
    } catch (e: any) { setError(e.message); setBusy(false); }
  }
  return <main className="min-h-screen grid place-items-center p-6"><div className="max-w-lg w-full rounded-3xl border border-white/10 bg-zinc-950 p-8 space-y-6">
    <p className="text-emerald-300 text-sm">VOIDFILL · PRIVATE DEMO</p><h1 className="text-3xl font-semibold">Try the full learner experience</h1>
    <p className="text-zinc-400">Upload a resume, explore your roadmap and insights, and take assessments without an account. Each session starts with a fresh profile.</p>
    <label className="block space-y-2"><span>Choose a target role</span><select className="w-full rounded-xl bg-zinc-900 p-3" value={role} onChange={e => setRole(Number(e.target.value))}>{["Data Analyst", "Frontend Developer", "AI Applications Developer"].map((name, i) => <option key={name} value={i}>{name}</option>)}</select></label>
    <p className="text-sm text-zinc-400">Guest data stays in temporary server memory. End demo deletes it immediately. Closing all demo tabs deletes it after a short grace period; a lost connection expires within about a minute. Sessions last at most two hours. The AI mentor still uses Gemini, so messages sent to it leave this device.</p>
    {error && <p role="alert" className="text-red-300">{error}</p>}<button disabled={busy} onClick={start} className="w-full rounded-xl bg-emerald-400 text-black p-3 font-semibold disabled:opacity-50">{busy ? "Opening…" : "Start temporary demo"}</button>
  </div></main>;
}
