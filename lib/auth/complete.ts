import type { SupabaseClient, User } from "@supabase/supabase-js";
import { signInDestination } from "./navigation";

export class SignInError extends Error {
  constructor(public code: "profile_unavailable" | "staff_required") {
    super(code);
  }
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function initialProfileFields(
  user: Pick<User, "id" | "email" | "user_metadata">,
) {
  const metadata = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || "",
    full_name: text(metadata.full_name || metadata.name, 120),
    phone: text(metadata.phone, 40),
    course: text(metadata.course, 160),
  };
}

// Works with the existing auth.users trigger. Existing profile values and XP are preserved.
export async function completeSignIn(
  supabase: SupabaseClient,
  user: User,
  options: { next?: unknown; staffOnly?: boolean } = {},
) {
  const staff = await supabase
    .from("admin_users")
    .select("admin_role")
    .eq("id", user.id)
    .maybeSingle();
  if (staff.error) throw new SignInError("profile_unavailable");
  const role = staff.data?.admin_role;
  if (options.staffOnly && !["mentor", "admin", "super_admin"].includes(role))
    throw new SignInError("staff_required");
  if (["mentor", "admin", "super_admin"].includes(role))
    return signInDestination({ role, onboarded: true, next: options.next });

  const fields = initialProfileFields(user);
  let profile = await supabase
    .from("profiles")
    .select("id,email,full_name,phone,course,onboarded")
    .eq("id", user.id)
    .maybeSingle();
  if (profile.error) throw new SignInError("profile_unavailable");
  if (!profile.data) {
    const inserted = await supabase
      .from("profiles")
      .insert({ ...fields, role: "student", onboarded: false });
    if (inserted.error && inserted.error.code !== "23505")
      throw new SignInError("profile_unavailable");
    profile = await supabase
      .from("profiles")
      .select("id,email,full_name,phone,course,onboarded")
      .eq("id", user.id)
      .maybeSingle();
    if (profile.error || !profile.data)
      throw new SignInError("profile_unavailable");
  }
  const patch: Record<string, string> = {};
  for (const key of ["email", "full_name", "phone", "course"] as const) {
    if (!profile.data[key] && fields[key]) patch[key] = fields[key];
  }
  if (Object.keys(patch).length) {
    const updated = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id);
    if (updated.error) throw new SignInError("profile_unavailable");
  }
  const stats = await supabase
    .from("user_stats")
    .upsert(
      { user_id: user.id },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
  if (stats.error) throw new SignInError("profile_unavailable");
  return signInDestination({
    onboarded: !!profile.data.onboarded,
    next: options.next,
  });
}
