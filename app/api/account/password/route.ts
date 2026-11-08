import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAuthServerClient } from "@/lib/supabase/server";
import { demoToken } from "@/lib/demo/server";
import { readBoundedText, RequestBodyError } from "@/lib/requestBody";
import { hasRecentRecoveryClaim, RECOVERY_COOKIE, recoveryCookieOptions, sameOriginRequest, validNewPassword, validRecoveryGrant } from "@/lib/auth/recovery";

export const dynamic = "force-dynamic";
function reply(error: string, status: number) { return NextResponse.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } }); }

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return reply("Invalid origin.", 403);
  if (await demoToken()) return reply("Leave the temporary demo before recovering your account.", 403);
  const client = await createAuthServerClient();
  const { data: { session } } = await client.auth.getSession();
  const { data: { user }, error } = await client.auth.getUser(session?.access_token);
  if (error || !user || !session) return reply("Request a fresh reset link before choosing a password.", 401);
  const store = await cookies();
  if (!hasRecentRecoveryClaim(session.access_token, user.id) || !validRecoveryGrant(store.get(RECOVERY_COOKIE)?.value, user.id, session.access_token)) return reply("This recovery session expired. Request a fresh reset link.", 403);
  try {
    if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") return reply("Use a JSON request.", 415);
    const body = JSON.parse(await readBoundedText(request, 1024));
    if (!body || Object.keys(body).some(key => key !== "password") || !validNewPassword(body.password)) return reply("Choose a password of at least 12 characters and no more than 256 UTF-8 bytes.", 400);
    const updated = await client.auth.updateUser({ password: body.password });
    if (updated.error) return reply("That password could not be saved. Choose a different passphrase or request a fresh reset link.", 400);
    store.set(RECOVERY_COOKIE, "", { ...recoveryCookieOptions(), maxAge: 0 });
    // End this recovery session only; do not log out unrelated browser/device sessions.
    const ended = await client.auth.signOut({ scope: "local" });
    return NextResponse.json({ ok: true, signed_out: !ended.error }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return reply(error instanceof RequestBodyError ? "Keep the request within the password form limits." : "The password request could not be read. Please retry.", error instanceof RequestBodyError ? error.status : 400);
  }
}
