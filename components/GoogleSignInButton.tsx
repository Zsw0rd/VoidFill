"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { createAuthClient } from "@/lib/supabase/browser";
import { safeNextPath } from "@/lib/auth/navigation";

export function GoogleSignInButton({
  next = "/dashboard",
  staff = false,
  disabled = false,
}: {
  next?: string;
  staff?: boolean;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  async function signIn() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", safeNextPath(next));
      if (staff) callback.searchParams.set("entry", "staff");
      const supabase = createAuthClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback.toString() },
      });
      if (error) throw error;
    } catch {
      setError(
        "Google sign-in is unavailable right now. Please try again or continue with email.",
      );
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="mt-7">
      <Button
        type="button"
        variant="soft"
        disabled={disabled}
        loading={busy}
        onClick={signIn}
        className="w-full !min-h-12"
      >
        {!busy && <Image src="/google.svg" width={18} height={18} alt="" />}
        <span>{busy ? "Connecting to Google…" : "Continue with Google"}</span>
      </Button>
      <p className="mt-3 text-center text-[10px] leading-5 text-muted">
        Read how your information is used in our{" "}
        <Link href="/privacy" className="underline">
          privacy notice
        </Link>
        .
      </p>
      {error && (
        <p role="alert" className="mt-3 text-xs leading-6 text-rust">
          {error}
        </p>
      )}
      <div className="mt-6 flex items-center gap-4 text-[10px] text-muted">
        <span className="h-px flex-1 bg-line" />
        or continue with email
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
