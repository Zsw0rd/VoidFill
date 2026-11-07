"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import {
  createAuthClient,
  leaveDemoBeforeSignIn,
} from "@/lib/supabase/browser";
import { completeSignIn, SignInError } from "@/lib/auth/complete";
import { AUTH_ERRORS } from "@/lib/auth/navigation";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { toast } from "@/components/toast/bus";
import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function SignupPage() {
  const supabase = createAuthClient();
  const submitting = useRef(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [course, setCourse] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            course: course.trim(),
          },
          emailRedirectTo: new URL(
            "/auth/callback?next=/onboarding",
            window.location.origin,
          ).toString(),
        },
      });
      if (error) return toast("Signup failed", error.message);
      if (!data.session) {
        setConfirmationSent(true);
        return;
      }
      if (!data.user) throw new Error("No authenticated user");
      const destination = await completeSignIn(supabase, data.user, {
        next: "/onboarding",
      });
      await leaveDemoBeforeSignIn();
      window.location.assign(destination);
    } catch (error) {
      toast(
        "Could not finish creating your account",
        error instanceof SignInError
          ? AUTH_ERRORS[error.code]
          : "Please check your connection. If your account was created, you can sign in to continue.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (confirmationSent)
    return (
      <AuthFrame>
        <section role="status">
          <p className="eyebrow mb-4">One more step</p>
          <h1>Check your inbox.</h1>
          <p className="mt-4 text-sm leading-7 text-muted">
            We’ve sent a confirmation link to{" "}
            <strong className="text-ink">{email}</strong>. Open it in this
            browser to finish creating your account, then set up your learning
            profile.
          </p>
          <p className="mt-4 text-xs leading-6 text-muted">
            If the address already has an account, sign in instead. Check your
            spam folder if the message hasn’t arrived.
          </p>
          <Link href="/auth/login" className="primary-link mt-7">
            Back to sign in
            <ArrowRight size={15} />
          </Link>
        </section>
      </AuthFrame>
    );

  return (
    <AuthFrame>
      <section>
        <p className="eyebrow mb-4">A fresh starting point</p>
        <h1>Make room for your future.</h1>
        <p className="mt-3 text-sm text-muted leading-7">
          Create your account. We’ll help you find your next step.
        </p>
        <GoogleSignInButton next="/onboarding" disabled={busy} />
        <form onSubmit={onSignup} className="mt-6 space-y-4" aria-busy={busy}>
          <div className="space-y-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Your name"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="course">Course / background</Label>
              <Input
                id="course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                required
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="Your phone number"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 6 characters"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-2 p-2 text-muted"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <Button loading={busy} className="w-full !min-h-12" type="submit">
            {busy ? (
              "Creating your account…"
            ) : (
              <>
                Create my account
                <ArrowRight size={15} />
              </>
            )}
          </Button>
        </form>
        <p className="mt-6 text-xs text-muted">
          Already have an account?{" "}
          <Link
            className="font-semibold text-ink hover:underline"
            href="/auth/login"
          >
            Sign in
          </Link>
        </p>
      </section>
    </AuthFrame>
  );
}
