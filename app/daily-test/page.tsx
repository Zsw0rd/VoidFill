import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { DailyTestClient } from "./ui";
import { isoDate } from "@/lib/date";

export default async function DailyTestPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", user.id).maybeSingle();
  if (!profile?.onboarded) redirect("/onboarding");

  const today = isoDate(new Date());
  const { data: existing } = await supabase
    .from("daily_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("attempt_date", today)
    .maybeSingle();

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <DailyTestClient existingAttempt={existing} />
      </div>
    </AppShell>
  );
}
