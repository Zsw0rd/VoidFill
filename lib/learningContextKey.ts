import { createHash } from "node:crypto";
import { careerCatalogue } from "./careerCatalog";
import type { LearningSkill } from "./localMl";

export function learningContextKey(context: {roleId: string; role: string; level: string; goalContext: string; skills: LearningSkill[]}) {
  return createHash("sha256").update(JSON.stringify([careerCatalogue.version, context.roleId, context.role, context.level, context.goalContext, [...context.skills].sort((a, b) => a.id.localeCompare(b.id)).map(skill => [skill.id, skill.score, skill.target, skill.importance])])).digest("hex");
}
