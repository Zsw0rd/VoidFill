export const LEARNER_PATHS = new Set([
  "/dashboard",
  "/onboarding",
  "/profile",
  "/resume",
  "/daily-test",
  "/practice-test",
  "/roadmap",
  "/skill-graph",
  "/ai-insights",
  "/mentor-chat",
]);
const STAFF_PATHS = new Set([
  "/admin/dashboard",
  "/admin/users",
  "/admin/mentors",
  "/admin/flagged",
  "/admin/profile",
  "/admin/mentor",
  "/admin/mentor/chat",
]);

// Accept only application destinations. Never turn an OAuth `next` into an open redirect.
export function safeNextPath(value: unknown, fallback = "/dashboard") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  )
    return fallback;
  try {
    const url = new URL(value, "https://voidfill.invalid");
    if (
      url.origin !== "https://voidfill.invalid" ||
      (!LEARNER_PATHS.has(url.pathname) && !STAFF_PATHS.has(url.pathname))
    )
      return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}

export function signInDestination({
  role,
  onboarded,
  next,
}: {
  role?: string | null;
  onboarded: boolean;
  next?: unknown;
}) {
  const requested = safeNextPath(next);
  const pathname = requested.split("?")[0];
  if (role === "mentor")
    return ["/admin/mentor", "/admin/mentor/chat", "/admin/profile"].includes(
      pathname,
    )
      ? requested
      : "/admin/mentor";
  if (role === "admin" || role === "super_admin")
    return STAFF_PATHS.has(pathname) ? requested : "/admin/dashboard";
  if (!onboarded) return "/onboarding";
  return LEARNER_PATHS.has(pathname) && pathname !== "/onboarding"
    ? requested
    : "/dashboard";
}

export const AUTH_ERRORS: Record<string, string> = {
  oauth_cancelled:
    "Google sign-in was cancelled. You can try again or use your email.",
  oauth_failed:
    "Google sign-in could not be completed. Please try again from this page.",
  invalid_callback:
    "This sign-in link is missing or has expired. Please start sign-in again.",
  profile_unavailable:
    "You signed in, but your learning profile could not be prepared. Please try again.",
  staff_required:
    "This account is not registered as staff. Use learner sign-in or contact your administrator.",
};
