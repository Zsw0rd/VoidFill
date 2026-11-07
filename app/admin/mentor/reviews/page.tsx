import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { createClient } from "@/lib/supabase/server";
import { canMentor } from "@/lib/auth/staff";
import { loadPracticalWorkspace } from "@/lib/practicalServer";
import { PracticalReviewQueue } from "./ui";
import "@/app/practical/practical.css";

export const dynamic = "force-dynamic";
export default async function PracticalReviewsPage() {
  const client = await createClient();
  const {data: {user}} = await client.auth.getUser();
  if (!user) redirect("/auth/login");
  const {data: staff} = await client.from("admin_users").select("admin_role,display_name").eq("id", user.id).maybeSingle();
  if (!canMentor(staff?.admin_role)) redirect("/dashboard");
  const workspace = await loadPracticalWorkspace(client, user.id, true);
  return <AdminShell role={staff!.admin_role} displayName={staff!.display_name || user.email || "Mentor"}><PracticalReviewQueue initial={workspace} /></AdminShell>;
}
