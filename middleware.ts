import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/admin-login",
  "/auth/logout",
];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/icon")) return true;
  if (pathname.startsWith("/assets")) return true;
  if (pathname.startsWith("/api")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Keep request cookies in sync for downstream handlers in the same request.
          req.cookies.set({ name, value, ...options });
          // Persist cookie to browser response.
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          req.cookies.set({ name, value: "", ...options });
          res.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // IMPORTANT: getUser() refreshes the session token if expired
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = req.nextUrl.pathname;

  if (!user && !isPublic(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Protect admin routes
  if (user && pathname.startsWith("/admin")) {
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("admin_role")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminUser) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (user && (pathname === "/auth/login" || pathname === "/auth/signup")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
