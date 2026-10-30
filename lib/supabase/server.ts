import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createDemoClient } from "@/lib/demo/client";
import { demoService, DEMO_COOKIE } from "@/lib/demo/server";

export function createClient() {
  const cookieStore = cookies();
  const token = cookieStore.get(DEMO_COOKIE)?.value;
  if (token) return createDemoClient((operation, body) => demoService(operation, body, token), token) as unknown as ReturnType<typeof createServerClient>;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // set() can throw in Server Components (read-only context)
            // This is fine — the middleware handles token refresh
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Same as above
          }
        },
      },
    },
  );
}
