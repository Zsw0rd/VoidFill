import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { createAuthServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoToken } from "@/lib/demo/server";
import { isAdministrator } from "@/lib/auth/staff";
import { AccountRequestInbox } from "./ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account requests · VoidFill" };

export default async function AccountRequestPage({ searchParams }: { searchParams: Promise<{ view?: string; page?: string }> }) {
  if (await demoToken()) return <AdminShell><section className="panel p-8"><h1 className="page-title">Account requests.</h1><p className="mt-4 text-sm leading-7 text-muted">Real account requests are unavailable in temporary demos.</p></section></AdminShell>;
  const client = await createAuthServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/auth/admin-login");
  const staff = await client.from("admin_users").select("admin_role,display_name").eq("id", user.id).maybeSingle();
  if (staff.error || !isAdministrator(staff.data?.admin_role)) redirect("/dashboard");
  const params = await searchParams;
  const all = params.view === "all";
  const page = typeof params.page === "string" && /^[1-9][0-9]{0,3}$/.test(params.page) ? Number(params.page) : 1;
  let query = createAdminClient().from("account_deletion_requests").select("id,user_id,account_email,staff_account,status,requested_at,updated_at,resolution,resolved_at");
  if (!all) query = query.in("status", ["pending", "in_review"]);
  const result = await query.order("requested_at", { ascending: !all }).order("id", { ascending: true }).range((page - 1) * 100, page * 100).abortSignal(AbortSignal.timeout(10000));
  const rows = result.data || [];
  const pageUrl = (index: number) => `/admin/account-requests?view=${all ? "all" : "open"}&page=${index}`;
  return <AdminShell role={staff.data?.admin_role} displayName={staff.data?.display_name || user.email}><div className="mx-auto max-w-5xl"><p className="eyebrow mb-3">Privacy operations</p><h1 className="page-title">Account requests.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-muted">Review deletion requests from verified accounts. Recording or closing a review does not erase an account. Confirm identity, coordinate shared records and transfer staff responsibilities before any separate removal.</p><nav aria-label="Account request views" className="mt-6 flex flex-wrap gap-5"><Link href="/admin/account-requests" className="secondary-link" aria-current={!all ? "page" : undefined}>Open requests · oldest first</Link><Link href="/admin/account-requests?view=all" className="secondary-link" aria-current={all ? "page" : undefined}>All requests · newest first</Link></nav>{result.error ? <p role="alert" className="panel mt-7 p-6 text-rust">The request inbox is temporarily unavailable. No request has been changed.</p> : <><AccountRequestInbox key={`${all ? "all" : "open"}:${page}`} initial={rows.slice(0, 100)} actorId={user.id} openOnly={!all} /><nav aria-label="Account request pages" className="mt-6 flex flex-wrap items-center gap-5">{page > 1 && <Link href={pageUrl(page - 1)} className="secondary-link">← Previous page</Link>}<span className="text-xs text-muted">Page {page}</span>{rows.length > 100 && page < 9999 && <Link href={pageUrl(page + 1)} className="secondary-link">Next page →</Link>}</nav></>}</div></AdminShell>;
}
