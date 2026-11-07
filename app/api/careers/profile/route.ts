import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/demo/server";
import { careerSelectionSchema, validatedCareerSelection } from "@/lib/careerProfile";
import { LearningError } from "@/lib/localMl";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error: "Invalid origin"}, {status: 403});
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: "unauthorized"}, {status: 401});
  const parsed = careerSelectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error: "Check your career selection and focus skills."}, {status: 400});
  try {
    const updates = await validatedCareerSelection(supabase, parsed.data);
    const {data, error} = await supabase.from("profiles").update(updates).eq("id", user.id).select("id").maybeSingle();
    if (error) throw new LearningError("Could not save your career direction.", 500);
    if (!data) throw new LearningError("Complete your profile before saving a career direction.", 409);
    // Requirements change; earned skill scores, history and XP are untouched.
    return NextResponse.json({ok: true, role_id: updates.target_role_id});
  } catch (error) {
    return NextResponse.json({error: error instanceof LearningError ? error.message : "Could not save your career direction."}, {status: error instanceof LearningError ? error.status : 500});
  }
}
