import { createHash } from "node:crypto";
import { careerCatalogue } from "./careerCatalog";

/** A context change retires a browser draft without deleting earned progress. */
export function assessmentContextKey(profile: {
  target_role_id?: string | null;
  custom_target_role?: string | null;
  career_level?: string | null;
  career_focus_skill_ids?: string[] | null;
  career_goal_context?: string | null;
}) {
  return createHash("sha256").update(JSON.stringify([
    careerCatalogue.version, profile.target_role_id || "",
    profile.custom_target_role?.trim() || "",
    profile.career_level === "intermediate" ? "intermediate" : "foundation",
    [...new Set(profile.career_focus_skill_ids || [])].sort(),
    profile.career_goal_context || "",
  ])).digest("hex");
}
