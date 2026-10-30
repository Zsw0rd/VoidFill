import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const DEMO_COOKIE = "vf_demo_session";
export const DEMO_MARKER = "vf_demo_active";
export function demoToken() { return cookies().get(DEMO_COOKIE)?.value; }

export function validDemoKey(key: unknown): boolean {
  const expected = process.env.DEMO_ENTRY_KEY;
  return typeof key === "string" && /^[a-f0-9]{32,128}$/i.test(key) && !!expected && expected.length >= 32 && Buffer.byteLength(key) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(key), Buffer.from(expected));
}

export async function demoService(operation: string, body: unknown = {}, token = "") {
  const response = await fetch(new URL(`/guest/${operation}`, process.env.ML_SERVICE_URL || "http://127.0.0.1:8010"), { method: "POST", headers: { "Content-Type": "application/json", "X-ML-Token": process.env.ML_SERVICE_TOKEN || "", "X-Demo-Token": token }, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(15000) });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.detail || "Demo service unavailable"), { status: response.status });
  return result;
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export function clearDemoCookies() {
  for (const name of [DEMO_COOKIE, DEMO_MARKER]) cookies().set(name, "", { path: "/", maxAge: 0, sameSite: "strict", httpOnly: name === DEMO_COOKIE, secure: process.env.NODE_ENV === "production" });
}
