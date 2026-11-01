import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearDemoCookies, demoService, demoStaffAccount, demoToken, DEMO_COOKIE, DEMO_MARKER, sameOrigin, validDemoKey } from "@/lib/demo/server";

export const dynamic = "force-dynamic";
export async function POST(request: Request, { params }: { params: { operation: string } }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 1_000_000) return NextResponse.json({ error: "Request too large" }, { status: 413 });
  const body = await request.json().catch(() => ({}));
  const operation = params.operation;
  if (!["start", "db", "user", "lease", "end"].includes(operation)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const token = demoToken();
    if (operation === "start") {
      if (!validDemoKey(body.key)) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const staff = body.staff ? demoStaffAccount(body.email, body.password) : null;
      if (body.staff && !staff) return NextResponse.json({ error: "Invalid demo email or password" }, { status: 401 });
      if (token) await demoService("end", {}, token);
      const result = await demoService("start", staff ? { staff } : { role: body.role ?? 0 });
      const options = { path: "/", sameSite: "strict" as const, secure: process.env.NODE_ENV === "production" };
      // Session cookies deliberately have no persistent expiry.
      cookies().set(DEMO_COOKIE, result.token, { ...options, httpOnly: true });
      cookies().set(DEMO_MARKER, "1", { ...options, httpOnly: false });
      return NextResponse.json({ ok: true, redirect: staff === "admin" ? "/admin/dashboard" : staff ? "/admin/mentor" : "/resume" }, { headers: { "Cache-Control": "no-store" } });
    }
    if (operation === "end") {
      if (token) await demoService("end", {}, token);
      clearDemoCookies();
      return NextResponse.json({ ok: true });
    }
    if (!token) return NextResponse.json({ error: "Demo session ended" }, { status: 401 });
    const data = await demoService(operation === "db" ? "query" : operation, body, token);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    if (error.status === 401) clearDemoCookies();
    return NextResponse.json({ error: error.status ? error.message : "Local demo service unavailable" }, { status: error.status || 503 });
  }
}
