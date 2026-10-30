import { createBrowserClient } from "@supabase/ssr";
import { demoBrowserClient } from "@/lib/demo/client";

export function createClient() {
  if (typeof document !== "undefined" && document.cookie.split("; ").includes("vf_demo_active=1")) return demoBrowserClient() as unknown as ReturnType<typeof createBrowserClient>;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
