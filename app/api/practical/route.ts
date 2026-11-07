import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/demo/server";
import { practicalMutationSchema } from "@/lib/practical";
import { loadPracticalWorkspace, mutatePractical, PracticalError } from "@/lib/practicalServer";
import { operationBudget, withApiTelemetry } from "@/lib/apiOperations";
import { readBoundedText } from "@/lib/requestBody";

export const dynamic = "force-dynamic";
function failure(error: unknown) {
  const status = error instanceof PracticalError ? error.status : typeof (error as any)?.status === "number" ? (error as any).status : 503;
  const message = error instanceof PracticalError || (status >= 400 && status < 500 && error instanceof Error)
    ? (error as Error).message : "Practical workspace unavailable. Please retry.";
  return NextResponse.json({error: message}, {status, headers: {"Cache-Control": "no-store"}});
}
export async function GET(request: Request) {
  try {
    const client = await createClient();
    const {data: {user}} = await client.auth.getUser();
    if (!user) return NextResponse.json({error: "Sign in to view practical work."}, {status: 401});
    const mode = new URL(request.url).searchParams.get("mode");
    if (mode && !["mentor", "learner"].includes(mode)) return NextResponse.json({error: "Invalid workspace."}, {status: 400});
    return NextResponse.json(await loadPracticalWorkspace(client, user.id, mode === "mentor"), {headers: {"Cache-Control": "no-store"}});
  } catch (error) { return failure(error); }
}
async function handlePost(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error: "Invalid origin."}, {status: 403});
  if (Number(request.headers.get("content-length") || 0) > 80000) return NextResponse.json({error: "Keep your evidence within the workspace limits."}, {status: 413});
  try {
    const client = await createClient();
    const {data: {user}} = await client.auth.getUser();
    if (!user) return NextResponse.json({error: "Sign in to save practical work."}, {status: 401});
    const limited = await operationBudget(client, user.id, "practical");
    if (limited) return limited;
    const text = await readBoundedText(request,80000);
    const parsed = practicalMutationSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return NextResponse.json({error: parsed.error.issues[0]?.message || "Check your practical work details."}, {status: 400});
    return NextResponse.json(await mutatePractical(client, user.id, parsed.data), {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({error: "Invalid request."}, {status: 400});
    return failure(error);
  }
}
export const POST = withApiTelemetry("practical", handlePost);
