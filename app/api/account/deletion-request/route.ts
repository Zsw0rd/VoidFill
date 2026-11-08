import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoToken } from "@/lib/demo/server";
import { accountRequestInput, confirmedAccountEmail } from "@/lib/account";
import { sameOriginRequest } from "@/lib/auth/recovery";
import { readBoundedText, RequestBodyError } from "@/lib/requestBody";

export const dynamic = "force-dynamic";
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } }); }

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return json({ error: "Invalid origin." }, 403);
  if (await demoToken()) return json({ error: "A temporary demo cannot request deletion of a real account." }, 403);
  const client = await createAuthServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || !user.email_confirmed_at || !user.email) return json({ error: "Sign in with a verified email to manage your request." }, 401);
  try {
    if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") return json({ error: "Use a JSON request." }, 415);
    const input = accountRequestInput(JSON.parse(await readBoundedText(request, 4096)));
    if (!input) return json({ error: "Check the request details and try again." }, 400);
    if (input.action === "request" && !confirmedAccountEmail(input.confirmation, user.email)) return json({ error: "Type your account email to confirm this deletion request." }, 400);
    const result = await createAdminClient().rpc("vf_manage_account_deletion_request", { p_actor: user.id, p_action: input.action, p_request_id: input.requestId || null, p_resolution: null }).abortSignal(AbortSignal.timeout(10000));
    if (result.error) return json({ error: "Your request could not be updated. Refresh to check its current status, or contact support through the privacy notice." }, 503);
    return json({ request: result.data });
  } catch (failure) { return json({ error: "Your request could not be read. Please retry." }, failure instanceof RequestBodyError ? failure.status : 400); }
}
