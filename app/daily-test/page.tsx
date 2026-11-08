import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { DailyTestClient } from "./ui";
import { loadCareerRequirements } from "@/lib/careerRequirements";
import { hasKnowledgeCoverage } from "@/lib/careerCatalog";
import { isoDate } from "@/lib/date";
import { assessmentContextKey } from "@/lib/assessmentContext";

export default async function DailyTestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.onboarded) redirect("/onboarding");

  const requirements = await loadCareerRequirements(supabase, profile);
  const covered = requirements.filter(row => hasKnowledgeCoverage(row.skills.name)).length;

  const today = isoDate(new Date());
  const { data: existing } = await supabase
    .from("daily_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("attempt_date", today)
    .maybeSingle();

  return (
    <AppShell displayName={profile?.full_name || user.email || "Learner"}>
      <div className="max-w-4xl mx-auto">
        <DailyTestClient ownerId={user.id} contextKey={assessmentContextKey(profile)} existingAttempt={existing} coverage={{covered, total: requirements.length}} />
      </div>
    </AppShell>
  );
}
