"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Download, KeyRound, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DELETION_STATUSES } from "@/lib/account";

export type AccountRequest = { id: string; status: string; requested_at: string; updated_at: string; staff_account: boolean; resolution: string; resolved_at: string | null };

export function AccountControls({ email, passwordAccount, verifiedEmail, initialRequest, requestUnavailable }: { email: string; passwordAccount: boolean; verifiedEmail: boolean; initialRequest: AccountRequest | null; requestUnavailable: boolean }) {
  const [request, setRequest] = useState(initialRequest);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const working = useRef(false);
  const active = request && ["pending", "in_review"].includes(request.status);
  async function exportData() {
    if (working.current) return;
    working.current = true; setBusy("export"); setError(""); setNotice("");
    try {
      const response = await fetch("/api/account/export", { method: "POST" });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error || "Your export could not be prepared."); }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `voidfill-account-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Your account export is ready. Keep the downloaded file private; it contains your personal learning records.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Please check your connection and retry."); }
    finally { working.current = false; setBusy(""); }
  }
  async function updateRequest(action: "request" | "cancel", event?: React.FormEvent) {
    event?.preventDefault();
    if (working.current) return;
    working.current = true; setBusy(action); setError(""); setNotice("");
    try {
      const response = await fetch("/api/account/deletion-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action === "request" ? { action, confirmation } : { action, requestId: request?.id }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Your request could not be updated.");
      setRequest(body.request); setConfirmation("");
      setNotice(action === "request" ? "Your deletion request is recorded. Your account remains active while an administrator reviews it." : "Your deletion request is cancelled. Your account and learning records remain available.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Please check your connection and retry."); }
    finally { working.current = false; setBusy(""); }
  }
  return <div className="space-y-6">
    <section className="panel p-6 sm:p-8" aria-labelledby="account-signin"><div className="flex items-center gap-3"><KeyRound size={21} className="text-forest" /><h2 id="account-signin" className="text-xl">Sign-in & recovery</h2></div><p className="mt-4 break-all text-sm font-semibold">{email}</p><p className="mt-2 text-sm leading-7 text-muted">{passwordAccount ? "If you forget your VoidFill password, request a one-time link and open it in this same browser. Email recovery currently has limited delivery; contact support through the privacy notice if no link arrives." : "Your Google password is managed by Google. Continue using Google sign-in; VoidFill does not change your Google password."}</p>{passwordAccount && <Link href="/auth/forgot-password" className="secondary-link mt-5">Request a password reset <ArrowUpRight size={15} /></Link>}</section>
    <section className="panel p-6 sm:p-8" aria-labelledby="account-export"><div className="flex items-center gap-3"><Download size={21} className="text-forest" /><h2 id="account-export" className="text-xl">Take your learning records</h2></div><p className="mt-4 text-sm leading-7 text-muted">Download your profile, saved assessments and scores, roadmap, practical drafts and feedback shared with you, plus your own and AI chat messages. The JSON file stays on your device after download.</p><p id="account-export-help" className="mt-3 text-xs leading-6 text-muted">Exports exclude login credentials, authentication tokens, internal moderation, other learners and mentor-authored chat messages. Larger accounts may need an assisted export.</p><Button onClick={exportData} loading={busy === "export"} disabled={!!busy} className="mt-5" aria-describedby="account-export-help">Download my account data</Button></section>
    <section className="panel p-6 sm:p-8" aria-labelledby="account-deletion"><div className="flex items-center gap-3"><ShieldCheck size={21} className="text-rust" /><h2 id="account-deletion" className="text-xl">Request account deletion</h2></div><p className="mt-4 text-sm leading-7 text-muted">A request goes to the VoidFill administrator for review. It does not immediately erase your account. You can cancel while review is open. An administrator must confirm identity, review shared records and transfer staff responsibilities before any removal.</p><p className="mt-3 text-xs leading-6 text-muted">There is no guaranteed completion time. You can follow up through the <Link href="/privacy" className="text-forest underline">privacy contact</Link>. Keep an export first if you want to retain your learning history.</p>
      {request && <div className="mt-5 rounded-2xl border border-line bg-paper p-5"><p className="text-sm font-semibold">{DELETION_STATUSES[request.status] || "Request saved"}</p><p className="mt-2 text-xs leading-6 text-muted">Requested {new Date(request.requested_at).toLocaleString()}<br />Reference: <span className="break-all">{request.id}</span></p>{request.staff_account && <p className="mt-3 text-xs leading-6 text-rust">This account has staff access. A separate administrator must review responsibility transfer before removal.</p>}{request.resolution && <div className="mt-4 border-t border-line pt-4"><p className="text-xs font-semibold">Administrator response</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{request.resolution}</p><p className="mt-2 text-xs text-muted">A closed review does not itself delete your account.</p></div>}{active && <Button variant="soft" onClick={() => updateRequest("cancel")} loading={busy === "cancel"} disabled={!!busy || requestUnavailable} className="mt-4">Cancel my deletion request</Button>}</div>}
      {requestUnavailable ? <p className="mt-5 text-sm leading-7 text-rust">Request status is temporarily unavailable. Contact support through the privacy notice; refresh this page before trying again.</p> : !verifiedEmail ? <p className="mt-5 text-sm text-rust">Verify your account email before recording a deletion request.</p> : !active && <form onSubmit={event => updateRequest("request", event)} className="mt-6 space-y-4"><div className="space-y-2"><Label htmlFor="deletion-email">Type your account email to request deletion</Label><Input id="deletion-email" type="email" autoComplete="off" maxLength={254} value={confirmation} onChange={event => setConfirmation(event.target.value)} required aria-describedby="deletion-request-help" /><p id="deletion-request-help" className="text-xs leading-6 text-muted">This records a request for this signed-in account only.</p></div><Button type="submit" variant="soft" loading={busy === "request"} disabled={!!busy || confirmation.trim().toLowerCase() !== email.toLowerCase()}>Record my deletion request</Button></form>}
    </section>
    {error && <p role="alert" className="rounded-xl border border-rust/20 bg-rust/5 p-4 text-sm leading-7 text-rust">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-forest/20 bg-forest/5 p-4 text-sm leading-7 text-forest">{notice}</p>}
  </div>;
}
