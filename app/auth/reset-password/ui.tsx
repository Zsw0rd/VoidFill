"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const submitting = useRef(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (password !== confirmation) { setError("The two passwords need to match."); return; }
    submitting.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const body = await response.json();
      if (!response.ok) setError(body.error || "Your password could not be updated. Please try again.");
      else { setPassword(""); setConfirmation(""); setDone(true); }
    } catch { setError("Please check your connection and retry. If the password was updated, use it to sign in."); }
    finally { submitting.current = false; setBusy(false); }
  }
  if (done) return <div className="mt-5 space-y-5"><p role="status" className="text-sm leading-7 text-muted">Your password is updated. Sign in with your new password to continue.</p><Link href="/auth/login" className="primary-link">Back to sign in →</Link></div>;
  return <form onSubmit={submit} className="mt-6 space-y-5" aria-busy={busy}>
    <p className="text-sm leading-7 text-muted">Use at least 12 characters. A unique passphrase is easier to remember. Complete this within ten minutes of opening your reset link.</p>
    <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} aria-describedby="new-password-help" /><p id="new-password-help" className="text-xs text-muted">At least 12 characters; your password is never added to your profile or export.</p></div>
    <div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></div>
    {error && <p role="alert" className="rounded-xl border border-rust/20 bg-rust/5 p-4 text-sm leading-6 text-rust">{error}</p>}
    <Button type="submit" loading={busy} className="w-full !min-h-12">Save new password</Button>
    <Link href="/auth/forgot-password" className="secondary-link">Request a fresh link</Link>
  </form>;
}
