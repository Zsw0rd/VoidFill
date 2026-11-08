import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";
import { demoToken } from "@/lib/demo/server";
import { collectAccountExport } from "@/lib/account";
import { sameOriginRequest } from "@/lib/auth/recovery";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403, headers: privateHeaders });
  if (await demoToken()) return NextResponse.json({ error: "Account exports are available after leaving the temporary demo and signing in." }, { status: 403, headers: privateHeaders });
  const client = await createAuthServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to export your account." }, { status: 401, headers: privateHeaders });
  try {
    const result = await collectAccountExport(client, user);
    return new NextResponse(JSON.stringify(result), { headers: { ...privateHeaders, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="voidfill-account-${new Date().toISOString().slice(0, 10)}.json"` } });
  } catch {
    return NextResponse.json({ error: "Your complete export could not be prepared. Try again later, or contact support through the privacy notice for an assisted export. No partial file was downloaded." }, { status: 503, headers: privateHeaders });
  }
}
