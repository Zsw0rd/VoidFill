import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { AIInsightsClient } from "./ui";

export default async function AIInsightsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!profile?.onboarded) redirect("/onboarding");

    return (
        <AppShell>
            <div className="max-w-6xl mx-auto">
                <AIInsightsClient hasRole={!!profile.target_role_id} />
            </div>
        </AppShell>
    );
}
