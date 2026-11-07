import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLearningContext } from "@/lib/learningContext";
import { learningContextKey } from "@/lib/learningContextKey";
import { LearningError } from "@/lib/localMl";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data, error } = await supabase
        .from("ai_insights")
        .select("analysis, meta, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Fetch insights error:", error);
        return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
    }

    if (!data || data.meta?.engine !== "local-ml") {
        return NextResponse.json({ cached: false });
    }

    try {
        const context = await getLearningContext(supabase, user.id);
        if (data.meta.contextKey !== learningContextKey(context)) return NextResponse.json({cached: false});
    } catch (error) {
        if (error instanceof LearningError && error.status === 400) return NextResponse.json({cached: false});
        return NextResponse.json({error: "Could not verify your current learning direction."}, {status: 500});
    }

    return NextResponse.json({
        cached: true,
        analysis: data.analysis,
        meta: data.meta,
        updatedAt: data.updated_at,
    });
}
