import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = profile?.role === "admin";

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
              <Badge tone={isAdmin ? "good" : "warn"}>{isAdmin ? "Admin" : "Student"}</Badge>
            </div>
            <p className="mt-1 text-sm text-zinc-400">Placeholder template only (user-first build).</p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="font-semibold">Planned admin modules</div>
              <ul className="mt-2 text-sm text-zinc-300 list-disc pl-5 space-y-1">
                <li>Question bank + skill tagging</li>
                <li>Role templates + weight editing</li>
                <li>Analytics: cohort trends, weak skills, completion rates</li>
                <li>Moderation + resource curation</li>
              </ul>
            </div>

            {!isAdmin ? (
              <div className="text-sm text-zinc-400">
                You’re not an admin. When you add admin users, set <span className="text-zinc-200">profiles.role = 'admin'</span>.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
