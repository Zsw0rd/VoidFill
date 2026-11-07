"use client";
import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import {
  createAuthClient,
  leaveDemoBeforeSignIn,
} from "@/lib/supabase/browser";
import { completeSignIn, SignInError } from "@/lib/auth/complete";
import { AUTH_ERRORS, safeNextPath } from "@/lib/auth/navigation";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { toast } from "@/components/toast/bus";
import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
function AdminLoginForm() {
  const sp = useSearchParams();
  const next = safeNextPath(sp.get("next"), "/admin/dashboard");

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    if (email.trim().toLowerCase().endsWith("@demo.voidfill.local")) {
      return toast(
        "Use the private demo page",
        "Enter these credentials in the Admin & mentor demo login form at your private demo URL.",
      );
    }
    submitting.current = true;
    setBusy(true);
    try {
      const supabase = createAuthClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setBusy(false);
        return toast("Login failed", error.message);
      }

      if (!data.user) throw new Error("No authenticated user");
      const destination = await completeSignIn(supabase, data.user, {
        next,
        staffOnly: true,
      });
      await leaveDemoBeforeSignIn();
      window.location.assign(destination);
    } catch (error) {
      toast(
        "Could not finish sign-in",
        error instanceof SignInError
          ? AUTH_ERRORS[error.code]
          : "Please check your connection and try again.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <section>
      <p className="eyebrow mb-4">Staff desk</p>
      <h1>Welcome to the desk.</h1>
      <p className="mt-3 text-sm text-muted leading-7">
        Sign in to support your learners and keep things moving.
      </p>
      {sp.get("error") && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-rust/20 bg-rust/5 p-4 text-xs leading-6 text-rust"
        >
          {AUTH_ERRORS[sp.get("error")!] || AUTH_ERRORS.oauth_failed}
        </p>
      )}
      <GoogleSignInButton next={next} staff disabled={busy} />
      <form onSubmit={onLogin} className="mt-6 space-y-5" aria-busy={busy}>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
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
            "Signing in…"
          ) : (
            <>
              Sign in to staff desk
              <ArrowRight size={15} />
            </>
          )}
        </Button>
      </form>
      <div className="mt-7 border-t border-line pt-6 text-xs text-muted leading-6">
        <Link href="/auth/login" className="section-link">
          Back to learner sign in <ArrowRight size={12} />
        </Link>
      </div>
    </section>
  );
}
export default function AdminLoginPage() {
  return (
    <AuthFrame staff>
      <Suspense
        fallback={
          <p className="text-sm text-muted" role="status">
            Preparing your workspace…
          </p>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </AuthFrame>
  );
}
