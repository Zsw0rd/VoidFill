import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/demo/server";

const input = z.object({role_id: z.string().uuid(), content: z.string().trim().max(10000)}).strict();
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error: "Invalid origin"}, {status: 403});
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: "unauthorized"}, {status: 401});
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error: "Keep your reflection within 10,000 characters."}, {status: 400});
  const {data: role, error: roleError} = await supabase.from("roles").select("id").eq("id", parsed.data.role_id).maybeSingle();
  if (roleError || !role) return NextResponse.json({error: "Choose an available career profile."}, {status: 400});
  const {error} = await supabase.from("career_reflections").upsert({user_id: user.id, role_id: role.id, content: parsed.data.content, updated_at: new Date().toISOString()}, {onConflict: "user_id,role_id"});
  if (error) return NextResponse.json({error: "Could not save your private reflection."}, {status: 500});
  return NextResponse.json({ok: true, evidence: "ungraded reflection"});
}
