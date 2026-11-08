import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { beginRuntimeObservation, privateRuntimeObservation } from "@/lib/runtimeTelemetry";

export type LearningOperation = "assessment" | "recommendation" | "insight" | "resume" | "chat" | "practical";
type SessionClient = { __demoToken?: string };

/** Call only after getUser has verified the request identity. Never trust an id in the body. */
export async function operationBudget(client: unknown, userId: string, operation: LearningOperation): Promise<NextResponse | null> {
  // Disposable demos already have capability, lease and capacity controls. A forged token
  // cannot reach this point: routes verify its synthetic user before consulting the budget.
  if ((client as SessionClient).__demoToken) return null;
  try {
    const { data, error } = await createAdminClient().rpc("vf_consume_operation_budget", { p_user_id: userId, p_operation: operation }).abortSignal(AbortSignal.timeout(5000));
    if (error || !data || typeof data.allowed !== "boolean") throw new Error("budget unavailable");
    if (!data.allowed) {
      const seconds=Math.min(86400,Math.max(1,Math.ceil(Number(data.retry_after) || 60)));
      const wait=seconds<60 ? `${seconds} seconds` : seconds<3600 ? `${Math.ceil(seconds/60)} minutes` : `${Math.ceil(seconds/3600)} hours`;
      return NextResponse.json({ error: `You’ve reached the request limit for this activity. Try again in about ${wait}.`, retry_after: seconds }, { status: 429, headers: { "Retry-After": String(seconds), "Cache-Control": "private, no-store" } });
    }
    return null;
  } catch {
    // Do not turn a database outage into an unbounded inference bill.
    return NextResponse.json({ error: "This activity is temporarily unavailable. Please try again shortly." }, { status: 503, headers: { "Retry-After": "30", "Cache-Control": "private, no-store" } });
  }
}

/** Operational metadata only. No ids, email, cookies, input text or query strings. */
export function withApiTelemetry(operation: string, handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    const requestId = randomUUID();
    const start = performance.now();
    const runtimeStart = beginRuntimeObservation();
    let response: Response;
    try {
      const origin = request.headers.get("origin");
      response = origin && origin !== new URL(request.url).origin
        ? NextResponse.json({ error: "Invalid origin" }, { status: 403 })
        : process.env.LEARNING_MAINTENANCE === "1"
          ? NextResponse.json({ error: "Learning activities are briefly paused for an update. Your saved progress is safe; please try again shortly." }, { status: 503, headers: { "Retry-After": "60" } })
          : await handler(request);
    }
    catch { response = NextResponse.json({ error: "The request could not be completed. Please try again.", request_id: requestId }, { status: 500 }); }
    const duration = Math.round((performance.now() - start) * 10) / 10;
    response.headers.set("X-Request-Id", requestId);
    response.headers.append("Server-Timing", `app;dur=${duration}`);
    response.headers.set("Cache-Control", "private, no-store");
    console.info(JSON.stringify({ event: "api_request", operation, request_id: requestId, status: response.status, duration_ms: duration, runtime:privateRuntimeObservation(runtimeStart) }));
    return response;
  };
}
