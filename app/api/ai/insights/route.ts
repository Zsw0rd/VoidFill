import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = createClient();
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

    if (!data) {
        return NextResponse.json({ cached: false });
    }

    return NextResponse.json({
        cached: true,
        analysis: data.analysis,
        meta: data.meta,
        updatedAt: data.updated_at,
    });
}
