import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";
import { completeSignIn, SignInError } from "@/lib/auth/complete";
import { safeNextPath } from "@/lib/auth/navigation";
import { clearDemoCookies, demoService, demoToken } from "@/lib/demo/server";
import { exchangeRecoveryAwareCode, hasRecentRecoveryClaim, issueRecoveryGrant, RECOVERY_COOKIE, recoveryCookieOptions } from "@/lib/auth/recovery";

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
    const flowId = url.searchParams.get("sb_flow_id");
    const { data, error, recovery } = await exchangeRecoveryAwareCode(supabase, code, flowId);
    if (error || !data.user) return failure("invalid_callback");
    if (url.searchParams.get("intent") === "recovery" || recovery) {
      // Query flags and SDK events only route this flow. Supabase must validate
      // the exact token and its server-issued recent recovery claim authorizes it.
      if (!data.session) return failure("invalid_recovery");
      const verified = await supabase.auth.getUser(data.session.access_token);
      if (verified.error || verified.data.user?.id !== data.user.id || !hasRecentRecoveryClaim(data.session.access_token, data.user.id)) return failure("invalid_recovery");
      const grant = issueRecoveryGrant(data.user.id, data.session.access_token);
      const guest = await demoToken();
      if (guest) { await demoService("end", {}, guest).catch(() => {}); await clearDemoCookies(); }
      const response = NextResponse.redirect(new URL("/auth/reset-password", url.origin), { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
      response.cookies.set(RECOVERY_COOKIE, grant, recoveryCookieOptions());
      return response;
    }
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
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    return failure(
      error instanceof SignInError ? error.code : "profile_unavailable",
    );
  }
}
