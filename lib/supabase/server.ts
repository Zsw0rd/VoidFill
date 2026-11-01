import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { createDemoClient } from "@/lib/demo/client";
import { demoService, DEMO_COOKIE } from "@/lib/demo/server";

export function createClient() {
  const cookieStore = cookies();
  const token = cookieStore.get(DEMO_COOKIE)?.value;
  if (token)
    return createDemoClient(
      (operation, body) => demoService(operation, body, token),
      token,
    ) as unknown as ReturnType<typeof createServerClient>;

  return createAuthServerClient();
}

export function createAuthServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          values: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            values.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components are read-only; middleware persists refreshed cookies.
          }
        },
      },
    },
  );
}
