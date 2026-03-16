import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const AUTH_REDIRECT_PATHS = new Set([
  "/auth/login",
  "/auth/signup",
]);

function needsSessionCheck(pathname: string) {
  return pathname.startsWith("/admin") || AUTH_REDIRECT_PATHS.has(pathname);
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (!needsSessionCheck(pathname)) {
    return NextResponse.next({
      request: { headers: new Headers(req.headers) },
    });
  }

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

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

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

  if (user && AUTH_REDIRECT_PATHS.has(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|assets).*)"],
};
