import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoToken } from "@/lib/demo/server";
import { accountRequestInput } from "@/lib/account";
import { isAdministrator } from "@/lib/auth/staff";
import { sameOriginRequest } from "@/lib/auth/recovery";
import { readBoundedText, RequestBodyError } from "@/lib/requestBody";

export const dynamic = "force-dynamic";
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } }); }
export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return json({ error: "Invalid origin." }, 403);
  if (await demoToken()) return json({ error: "Real privacy requests cannot be changed from a demo." }, 403);
  const client = await createAuthServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return json({ error: "Sign in to continue." }, 401);
  const staff = await client.from("admin_users").select("admin_role").eq("id", user.id).maybeSingle();
  if (staff.error || !isAdministrator(staff.data?.admin_role)) return json({ error: "Administrator access is required." }, 403);
  try {
    if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") return json({ error: "Use a JSON request." }, 415);
    const input = accountRequestInput(JSON.parse(await readBoundedText(request, 8192)), true);
    if (!input) return json({ error: "Check the request details and response length." }, 400);
    const result = await createAdminClient().rpc("vf_manage_account_deletion_request", { p_actor: user.id, p_action: input.action, p_request_id: input.requestId, p_resolution: input.resolution || null }).abortSignal(AbortSignal.timeout(10000));
    if (result.error) return json({ error: "This request cannot be updated. It may have been cancelled or reviewed elsewhere, or may be your own request. Refresh the inbox." }, 409);
    return json({ request: result.data });
  } catch (failure) { return json({ error: "Your request could not be read. Please retry." }, failure instanceof RequestBodyError ? failure.status : 400); }
}
