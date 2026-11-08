import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const RECOVERY_COOKIE = "vf_password_recovery";
export const RECOVERY_LIFETIME_SECONDS = 600;

function recoveryKey() {
  const secret = process.env.ML_ASSESSMENT_SECRET || process.env.ML_SERVICE_TOKEN;
  if (!secret || secret.length < 32) throw new Error("Account recovery is unavailable.");
  return createHmac("sha256", secret).update("voidfill/password-recovery/v1").digest();
}

function sessionDigest(accessToken: string) {
  return createHash("sha256").update(accessToken).digest("hex");
}

/** Claim inspection only: the caller MUST first validate this exact access token
 * with Supabase auth.getUser(accessToken). URL flags and SDK events are not proof. */
export function hasRecentRecoveryClaim(verifiedAccessToken: string, verifiedUserId: string, now = Date.now(), authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    if (!authUrl || verifiedAccessToken.length > 32768) return false;
    const parts = verifiedAccessToken.split(".");
    if (parts.length !== 3 || parts.some(part => !part)) return false;
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    const issuer = new URL("/auth/v1", authUrl).toString().replace(/\/$/, "");
    const seconds = Math.floor(now / 1000);
    return claims.sub === verifiedUserId && claims.iss === issuer && claims.role === "authenticated"
      && claims.is_anonymous === false && (claims.aud === "authenticated" || Array.isArray(claims.aud) && claims.aud.includes("authenticated"))
      && Number.isInteger(claims.exp) && claims.exp > seconds && Number.isInteger(claims.iat) && claims.iat <= seconds + 30
      && typeof claims.session_id === "string" && /^[0-9a-f-]{36}$/i.test(claims.session_id)
      && Array.isArray(claims.amr) && claims.amr.some((entry: unknown) => {
        if (!entry || typeof entry !== "object") return false;
        const amr = entry as Record<string, unknown>;
        return amr.method === "recovery" && Number.isInteger(amr.timestamp) && (amr.timestamp as number) <= seconds + 30 && (amr.timestamp as number) > seconds - RECOVERY_LIFETIME_SECONDS;
      });
  } catch { return false; }
}

/** Issued only after Supabase exchanges a PKCE recovery code, never from a query flag alone. */
export function issueRecoveryGrant(userId: string, accessToken: string, now = Date.now()) {
  if (!hasRecentRecoveryClaim(accessToken, userId, now)) throw new Error("A verified recovery session is required.");
  const body = Buffer.from(JSON.stringify({ v: 1, sub: userId, session: sessionDigest(accessToken), iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + RECOVERY_LIFETIME_SECONDS })).toString("base64url");
  return body + "." + createHmac("sha256", recoveryKey()).update(body).digest("base64url");
}

export function validRecoveryGrant(grant: unknown, userId: string, accessToken: string, now = Date.now()) {
  if (typeof grant !== "string" || grant.length > 1024 || !userId || !accessToken) return false;
  try {
    const parts = grant.split(".");
    if (parts.length !== 2) return false;
    const expected = createHmac("sha256", recoveryKey()).update(parts[0]).digest();
    const actual = Buffer.from(parts[1], "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
    const claims = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const seconds = Math.floor(now / 1000);
    return claims.v === 1 && claims.sub === userId && claims.session === sessionDigest(accessToken)
      && Number.isInteger(claims.iat) && Number.isInteger(claims.exp) && claims.iat <= seconds
      && claims.exp > seconds && claims.exp - claims.iat === RECOVERY_LIFETIME_SECONDS;
  } catch { return false; }
}

export function validNewPassword(value: unknown): value is string {
  // Unicode is accepted and passwords are never silently trimmed or truncated.
  return typeof value === "string" && value.length >= 12 && Buffer.byteLength(value, "utf8") <= 256;
}

export function sameOriginRequest(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export function recoveryCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: RECOVERY_LIFETIME_SECONDS };
}

/** PASSWORD_RECOVERY is the documented SDK event produced by a successful
 * recovery PKCE exchange. It must arrive during this exchange, not in a URL flag. */
export async function exchangeRecoveryAwareCode(client: SupabaseClient, code: string, flowId?: string | null) {
  let recovery = false;
  const { data: { subscription } } = client.auth.onAuthStateChange(event => { if (event === "PASSWORD_RECOVERY") recovery = true; });
  try {
    const result = await client.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
    return { ...result, recovery };
  } finally { subscription.unsubscribe(); }
}
