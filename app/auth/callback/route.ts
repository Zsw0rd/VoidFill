import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";
import { completeSignIn, SignInError } from "@/lib/auth/complete";
import { safeNextPath } from "@/lib/auth/navigation";
import { clearDemoCookies, demoService, demoToken } from "@/lib/demo/server";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const login =
    url.searchParams.get("entry") === "staff"
      ? "/auth/admin-login"
      : "/auth/login";
  const failure = (code: string) => {
    const target = new URL(login, url.origin);
    target.searchParams.set("error", code);
    target.searchParams.set("next", safeNextPath(url.searchParams.get("next")));
    return NextResponse.redirect(target, {
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  };
  if (url.searchParams.has("error"))
    return failure(
      url.searchParams.get("error") === "access_denied"
        ? "oauth_cancelled"
        : "oauth_failed",
    );
  const code = url.searchParams.get("code");
  if (!code) return failure("invalid_callback");
  const supabase = await createAuthServerClient();
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) return failure("invalid_callback");
    const destination = await completeSignIn(supabase, data.user, {
      next: url.searchParams.get("next"),
      staffOnly: url.searchParams.get("entry") === "staff",
    });
    const guest = await demoToken();
    if (guest) {
      // Stop a previous temporary workspace from masking the newly authenticated account.
      await demoService("end", {}, guest).catch(() => {});
      await clearDemoCookies();
    }
    return NextResponse.redirect(new URL(destination, url.origin), {
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    await supabase.auth.signOut().catch(() => {});
    return failure(
      error instanceof SignInError ? error.code : "profile_unavailable",
    );
  }
}
