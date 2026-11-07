export function isAdministrator(role?: string | null) {
  return role === "admin" || role === "super_admin";
}

// Administrators already have mentor permissions in the database policies.
// Sending a mentor reply still requires a specific learner assignment.
export function canMentor(role?: string | null) {
  return role === "mentor" || isAdministrator(role);
}

export function mentorRequestMode(role: string | null | undefined, targetUserId?: string) {
  if (targetUserId) return canMentor(role) ? "mentor" : "forbidden";
  return role === "mentor" ? "missing-target" : "learner";
}
