"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAuthClient } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true; setBusy(true); setError("");
    try {
      const { error: failure } = await createAuthClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: new URL("/auth/callback?intent=recovery", window.location.origin).toString(),
      });
      if (failure) setError("We couldn’t request a reset link. Wait a moment and try again. If you use Google, you can sign in with Google instead.");
      else setSent(true);
    } catch { setError("Please check your connection and try again."); }
    finally { sending.current = false; setBusy(false); }
  }
  return <AuthFrame><section>
    <p className="eyebrow mb-4">A way back in</p>
    <h1>{sent ? "Check your inbox." : "Reset your password."}</h1>
    {sent ? <div role="status" className="mt-5 space-y-4 text-sm leading-7 text-muted"><p>If this email belongs to an eligible account and delivery is available, a reset link will arrive. Check spam, then open the link in this same browser.</p><p>Email recovery currently has limited delivery. Google accounts can continue with Google without a VoidFill password. If no link arrives, <Link href="/privacy" className="text-forest underline">contact support</Link>.</p><p>Links expire and can be used once. You can return here later to request a fresh link.</p></div> : <>
      <p className="mt-4 text-sm leading-7 text-muted">Enter your account email to request a secure link. Open it in this same browser to choose a new password.</p>
      <p className="mt-4 rounded-xl border border-line bg-paper p-4 text-xs leading-6 text-muted">Email recovery currently has limited delivery and is not available for every address. If you use Google, sign in with Google instead. If no reset link arrives, use the <Link href="/privacy" className="text-forest underline">privacy contact</Link> for help.</p>
      <form onSubmit={send} className="mt-7 space-y-5" aria-busy={busy}>
        <div className="space-y-2"><Label htmlFor="recovery-email">Account email</Label><Input id="recovery-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} /></div>
        {error && <p role="alert" className="rounded-xl border border-rust/20 bg-rust/5 p-4 text-sm leading-6 text-rust">{error}</p>}
        <Button type="submit" loading={busy} className="w-full !min-h-12"><Mail size={16} /> Request reset link <ArrowRight size={16} /></Button>
      </form></>}
    <Link href="/auth/login" className="secondary-link mt-7">Back to sign in</Link>
  </section></AuthFrame>;
}
