import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AdminShell } from "@/components/AdminShell";
import { createAuthServerClient } from "@/lib/supabase/server";
import { demoToken } from "@/lib/demo/server";
import { ACCOUNT_REQUEST_COLUMNS } from "@/lib/account";
import { AccountControls } from "./ui";

export const metadata = { title: "Account & privacy · VoidFill" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (await demoToken()) return <AppShell><section className="panel mx-auto max-w-3xl p-7 sm:p-10"><p className="eyebrow mb-3">Temporary workspace</p><h1 className="page-title">Account & privacy.</h1><p className="mt-5 text-sm leading-7 text-muted">Account export, password recovery and deletion requests apply to a signed-in personal account. This demo contains disposable example data. Use End demo & delete data in the demo banner to leave it.</p><Link href="/profile" className="secondary-link mt-6">Back to the demo profile →</Link></section></AppShell>;
  const client = await createAuthServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/auth/login?next=/account");
  const [request, staff] = await Promise.all([
    client.from("account_deletion_requests").select(ACCOUNT_REQUEST_COLUMNS).eq("user_id", user.id).maybeSingle(),
    client.from("admin_users").select("admin_role,display_name").eq("id", user.id).maybeSingle(),
  ]);
  const content = <div className="mx-auto max-w-4xl"><div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow mb-3">Your account, your choices</p><h1 className="page-title">Account & privacy.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Manage your sign-in, take a copy of your learning records, or ask for your account to be removed.</p></div><Link href={staff.data ? "/admin/profile" : "/profile"} className="secondary-link">Back to profile ↗</Link></div>
    <AccountControls email={user.email || ""} passwordAccount={!!user.identities?.some(identity => identity.provider === "email")} verifiedEmail={!!user.email_confirmed_at} initialRequest={request.data} requestUnavailable={!!request.error} />
  </div>;
  return staff.data ? <AdminShell role={staff.data.admin_role} displayName={staff.data.display_name || user.email}>{content}</AdminShell> : <AppShell displayName={user.user_metadata?.full_name || user.email}>{content}</AppShell>;
}
