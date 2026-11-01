import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { LEARNER_PATHS, signInDestination } from "@/lib/auth/navigation";

const AUTH_REDIRECT_PATHS = new Set(["/auth/login", "/auth/signup"]);

function needsSessionCheck(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    LEARNER_PATHS.has(pathname) ||
    AUTH_REDIRECT_PATHS.has(pathname)
  );
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (req.cookies.has("vf_demo_session")) {
    if (pathname.startsWith("/admin") && !process.env.VERCEL) {
      try {
        const response = await fetch(
          new URL(
            "/guest/user",
            process.env.ML_SERVICE_URL || "http://127.0.0.1:8010",
          ),
          {
            method: "POST",
            headers: {
              "X-ML-Token": process.env.ML_SERVICE_TOKEN || "",
              "X-Demo-Token": req.cookies.get("vf_demo_session")!.value,
            },
            body: "{}",
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
          },
        );
        const role = (await response.json()).data?.user?.app_metadata
          ?.demo_staff_role;
        if (!response.ok || !["super_admin", "mentor"].includes(role))
          return NextResponse.redirect(new URL("/dashboard", req.url));
        if (
          role === "mentor" &&
          !(
            pathname === "/admin/profile" ||
            pathname === "/admin/mentor" ||
            pathname.startsWith("/admin/mentor/")
          )
        )
          return NextResponse.redirect(new URL("/admin/mentor", req.url));
      } catch {
        return NextResponse.redirect(new URL("/?demo=ended", req.url));
      }
    }
    const result = NextResponse.next();
    result.headers.set("X-Robots-Tag", "noindex, nofollow");
    result.headers.set("Referrer-Policy", "no-referrer");
    return result;
  }
  if (pathname.startsWith("/demo/")) {
    const result = NextResponse.next();
    result.headers.set("X-Robots-Tag", "noindex, nofollow");
    result.headers.set("Referrer-Policy", "no-referrer");
    return result;
  }

  if (!needsSessionCheck(pathname)) {
    return NextResponse.next({
      request: { headers: new Headers(req.headers) },
    });
  }

  let res = NextResponse.next({ request: { headers: req.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(
          values: { name: string; value: string; options: CookieOptions }[],
        ) {
          values.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: { headers: req.headers } });
          values.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  function redirect(path: string) {
    const target = new URL(path, req.url);
    const response = NextResponse.redirect(target);
    // Refreshed auth cookies must survive redirects as well as normal page responses.
    res.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthPage = AUTH_REDIRECT_PATHS.has(pathname);
  if (!user && !isAuthPage) {
    const login = new URL(
      pathname.startsWith("/admin") ? "/auth/admin-login" : "/auth/login",
      req.url,
    );
    login.searchParams.set("next", pathname + req.nextUrl.search);
    return redirect(login.pathname + login.search);
  }
  if (
    user &&
    (pathname.startsWith("/admin") ||
      (isAuthPage && !req.nextUrl.searchParams.has("error")))
  ) {
    const staff = await supabase
      .from("admin_users")
      .select("admin_role")
      .eq("id", user.id)
      .maybeSingle();
    if (staff.error) {
      const login = new URL(
        pathname.startsWith("/admin") ? "/auth/admin-login" : "/auth/login",
        req.url,
      );
      login.searchParams.set("error", "profile_unavailable");
      return redirect(login.pathname + login.search);
    }
    const role = staff.data?.admin_role;
    if (pathname.startsWith("/admin")) {
      if (!role) return redirect("/dashboard");
      if (
        role === "mentor" &&
        !["/admin/mentor", "/admin/mentor/chat", "/admin/profile"].includes(
          pathname,
        )
      )
        return redirect("/admin/mentor");
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", user.id)
        .maybeSingle();
      return redirect(
        signInDestination({
          role,
          onboarded: !!profile?.onboarded,
          next: req.nextUrl.searchParams.get("next"),
        }),
      );
    }
  }
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|assets|fonts|google.svg).*)",
  ],
};
