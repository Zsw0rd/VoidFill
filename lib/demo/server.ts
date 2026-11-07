import { mlServiceUrl } from "@/lib/mlServiceUrl";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const DEMO_COOKIE = "vf_demo_session";
export const DEMO_MARKER = "vf_demo_active";
export async function demoToken() {
  return (await cookies()).get(DEMO_COOKIE)?.value;
}

export function validDemoKey(key: unknown): boolean {
  const expected = process.env.DEMO_ENTRY_KEY;
  return (
    typeof key === "string" &&
    /^[a-f0-9]{32,128}$/i.test(key) &&
    !!expected &&
    expected.length >= 32 &&
    Buffer.byteLength(key) === Buffer.byteLength(expected) &&
    timingSafeEqual(Buffer.from(key), Buffer.from(expected))
  );
}

export function demoStaffAccount(email: unknown, password: unknown) {
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    password.length > 256
  )
    return null;
  const accounts = [
    ["admin@demo.voidfill.local", "DEMO_ADMIN_PASSWORD", "admin"],
    ["mentor@demo.voidfill.local", "DEMO_MENTOR_PASSWORD", "mentor"],
    ["mentor2@demo.voidfill.local", "DEMO_MENTOR2_PASSWORD", "mentor2"],
  ];
  const account = accounts.find(([id]) => id === email.trim().toLowerCase());
  const expected = account && process.env[account[1]];
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return account && expected && timingSafeEqual(hash(password), hash(expected))
    ? account[2]
    : null;
}

export async function demoService(
  operation: string,
  body: unknown = {},
  token = "",
) {
  const response = await fetch(mlServiceUrl(`/guest/${operation}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ML-Token": process.env.ML_SERVICE_TOKEN || "",
      "X-Demo-Token": token,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(result.detail || "Demo service unavailable"),
      { status: response.status },
    );
  return result;
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function clearDemoCookies() {
  const cookieStore = await cookies();
  for (const name of [DEMO_COOKIE, DEMO_MARKER])
    cookieStore.set(name, "", {
      path: "/",
      maxAge: 0,
      sameSite: "strict",
      httpOnly: name === DEMO_COOKIE,
      secure: process.env.NODE_ENV === "production",
    });
}
