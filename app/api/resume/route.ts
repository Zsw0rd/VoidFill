import { mlServiceUrl } from "@/lib/mlServiceUrl";
import { NextResponse } from "next/server";
import { PERSONAL_GOAL_NAME } from "@/lib/careerCatalog";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/demo/server";

export const dynamic = "force-dynamic";
const MAX_REQUEST = 4 * 1024 * 1024 + 65536;
async function boundedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader)
    throw Object.assign(new Error("Choose a resume file."), { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_REQUEST) {
      await reader.cancel();
      throw Object.assign(new Error("Choose a resume up to 4 MB."), {
        status: 413,
      });
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    if (Number(request.headers.get("content-length") || 0) > MAX_REQUEST)
      return NextResponse.json(
        { error: "Choose a resume up to 4 MB." },
        { status: 413 },
      );
    const bytes = await boundedBody(request);
    const form = await new Response(bytes, {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 4 * 1024 * 1024 ||
      !/\.(pdf|docx)$/i.test(file.name)
    )
      return NextResponse.json(
        { error: "Choose a PDF or DOCX up to 4 MB." },
        { status: 400 },
      );
    const payload = new FormData();
    payload.append("file", file);
    const response = await fetch(mlServiceUrl("/resume/parse"), {
      method: "POST",
      headers: { "X-ML-Token": process.env.ML_SERVICE_TOKEN || "" },
      body: payload,
      signal: AbortSignal.timeout(180000),
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok)
      return NextResponse.json(
        { error: result.detail || "Could not parse this resume." },
        { status: response.status },
      );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e.status
          ? e.message
          : "Resume service could not complete the request. Try a smaller file or check the local service.",
      },
      { status: e.status || 503 },
    );
  }
}

const applySchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    skills: z.array(z.string().trim().min(1).max(100)).max(80),
    role_id: z.string().uuid().optional(),
  })
  .strict();
export async function PATCH(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const input = applySchema.safeParse(await request.json().catch(() => null));
  if (!input.success)
    return NextResponse.json(
      { error: "Check the profile fields." },
      { status: 400 },
    );
  const updates: any = {
    current_skills_text: [...new Set(input.data.skills)].join(", "),
  };
  if (input.data.name) updates.full_name = input.data.name;
  if (input.data.role_id) {
    const { data: role } = await supabase
      .from("roles")
      .select("id,name")
      .eq("id", input.data.role_id)
      .maybeSingle();
    if (!role || role.name === PERSONAL_GOAL_NAME)
      return NextResponse.json(
        { error: "Choose an available role." },
        { status: 400 },
      );
    updates.target_role_id = role.id;
  }
  const { data: updated, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Could not update your profile." },
      { status: 500 },
    );
  if (!updated)
    return NextResponse.json(
      {
        error:
          "Complete your profile in onboarding before applying resume fields.",
      },
      { status: 409 },
    );
  // Resume claims never update mastery, assessment scores or XP.
  return NextResponse.json({ ok: true });
}
