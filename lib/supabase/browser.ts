import { createBrowserClient } from "@supabase/ssr";
import { demoBrowserClient } from "@/lib/demo/client";

export function createClient() {
  if (
    typeof document !== "undefined" &&
    document.cookie.split("; ").includes("vf_demo_active=1")
  )
    return demoBrowserClient() as unknown as ReturnType<
      typeof createBrowserClient
    >;
  return createAuthClient();
}

export function createAuthClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function leaveDemoBeforeSignIn() {
  if (!document.cookie.split("; ").includes("vf_demo_active=1")) return;
  const response = await fetch("/api/demo/end", { method: "POST" });
  if (!response.ok) throw new Error("Could not close the temporary workspace.");
}
