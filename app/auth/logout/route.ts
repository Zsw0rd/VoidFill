import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { demoToken, clearDemoCookies } from "@/lib/demo/server";

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  if (await demoToken()) await clearDemoCookies();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
