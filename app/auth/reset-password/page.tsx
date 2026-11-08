import { cookies } from "next/headers";
import Link from "next/link";
import { AuthFrame } from "@/components/AuthFrame";
import { createAuthServerClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE, validRecoveryGrant } from "@/lib/auth/recovery";
import { ResetPasswordForm } from "./ui";

export const metadata = { title: "Choose a new password · VoidFill" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const client = await createAuthServerClient();
  const { data: { session } } = await client.auth.getSession();
  const { data: { user }, error } = await client.auth.getUser(session?.access_token);
  const grant = (await cookies()).get(RECOVERY_COOKIE)?.value;
  const allowed = !error && user && session && validRecoveryGrant(grant, user.id, session.access_token);
  return <AuthFrame><section><p className="eyebrow mb-4">Account recovery</p><h1>{allowed ? "Choose a fresh password." : "Start with a fresh reset link."}</h1>
    {allowed ? <ResetPasswordForm /> : <><p className="mt-4 text-sm leading-7 text-muted">This reset session is missing, expired, or belongs to a different sign-in. Request another link and open it in the browser where you requested it.</p><Link href="/auth/forgot-password" className="primary-link mt-7">Request a reset link →</Link></>}
  </section></AuthFrame>;
}
