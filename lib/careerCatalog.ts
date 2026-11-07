import raw from "@/ml/data/careers/catalogue.json";

export type CareerLevel = "foundation" | "intermediate";
export type CareerMilestone = { id: string; title: string; outcome: string; skill_keys: string[]; deliverable: string; checks: string[]; prerequisites: string[] };
export type CareerCurriculumLevel = { milestones: CareerMilestone[]; assessment: { difficulty_min: number; difficulty_max: number; note: string } };
export type CareerCurriculum = { case: string; skill_sequence: string[]; foundation: CareerCurriculumLevel; intermediate: CareerCurriculumLevel; note: string };
export type CareerRequirement = { skill: string; importance: number; target: number; essential: boolean };
export type CareerSkill = { key: string; id: string; name: string; category: string; topic: string | null; assessment_mode: "objective" | "review"; aliases: string[]; description: string; coverage: { questions: number; resources: number; levels: number[]; scope: string } };
export type CareerProfile = { id: string; key: string; name: string; family: string; aliases: string[]; release_status: "pilot" | "explore"; description: string; scope: string; requirements: CareerRequirement[]; curriculum: CareerCurriculum; occupation: {code: string; title: string; url: string; relationship: string}; activity: {title: string; instructions: string; rubric: string[]; note: string; evidence_type: string} };
export type StoredCareer = { id: string; name: string; description?: string | null };

export const careerCatalogue = raw as unknown as {version: string; reviewed_at: string; families: {key: string; name: string; kind: string}[]; roles: CareerProfile[]; skills: CareerSkill[]; personal_goal_role: StoredCareer; sources: {name: string; url: string; license: string; license_url: string; publisher: string; changes: string}[]};
export const PERSONAL_GOAL_NAME = careerCatalogue.personal_goal_role.name;
export const MAX_FOCUS_SKILLS = 4;
export const normalizeCareerText = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const rolesByName = new Map(careerCatalogue.roles.map(role => [normalizeCareerText(role.name), role]));
const skillsByName = new Map(careerCatalogue.skills.map(skill => [normalizeCareerText(skill.name), skill]));
const skillsByKey = new Map(careerCatalogue.skills.map(skill => [skill.key, skill]));

export function careerForName(name?: string | null) { return name ? rolesByName.get(normalizeCareerText(name)) : undefined; }
export function careerSkillForName(name?: string | null) { return name ? skillsByName.get(normalizeCareerText(name)) : undefined; }
export function careerSkillForKey(key: string) { return skillsByKey.get(key); }
export function hasKnowledgeCoverage(name: string) { const skill = careerSkillForName(name); return !!skill?.topic && skill.coverage.questions >= 10; }
export function careerCoverage(role: CareerProfile) {
  const required = role.requirements.filter(item => item.essential);
  const covered = required.filter(item => { const skill = skillsByKey.get(item.skill); return !!skill?.topic && skill.coverage.questions >= 10; });
  return { covered: covered.length, total: required.length, review: required.length - covered.length };
}

/** Learning targets are curriculum goals, not a validated hiring/readiness score. */
export function requiredScore(row: {required_score?: number | null; weight?: number | null}, level: CareerLevel = "foundation") {
  const base = Number(row.required_score ?? Math.round(Number(row.weight ?? .75) * 100));
  return Math.max(0, Math.min(100, base + (level === "intermediate" ? 10 : 0)));
}

/** Select an authored bank, rather than relabelling easier questions. */
export function careerAssessmentDifficulty(level: CareerLevel, suggested: number) {
  return level === "intermediate" ? 3 : Math.min(2, Math.max(1, Math.round(suggested)));
}

const STOP = new Set("a an and as at be by for from i in into is it job my of on role the to want with work working skills responsible responsibilities years seeking looking career junior senior associate specialist engineer developer analyst manager professional me choose better new opportunity interesting something have".split(" "));
const TITLE_WORDS = new Set("coordinator technician administrator representative writer designer".split(" "));
const WORD_FORMS: Record<string, string> = { interfaces: "interface", apis: "api", databases: "database", networks: "networking", scientist: "science", scientists: "science", designer: "design", bookkeeper: "bookkeeping", analytics: "analysis", modelling: "modeling", workflows: "workflow", campaigns: "campaign", prototypes: "prototype", experiments: "experiment", systems: "system", applications: "application", pipelines: "pipeline" };
const tokens = (value: string) => new Set(normalizeCareerText(value).replace(/\bml\b/g, "machine learning").split(" ").map(word => WORD_FORMS[word] || word).filter(word => word.length > 1 && !STOP.has(word)));
const overlap = (a: Set<string>, b: Set<string>) => [...a].filter(value => b.has(value));

/** Explainable suggestions; scores are ranking signals, never fit probabilities. */
export function matchCareers(query: string, available?: StoredCareer[]) {
  const input = normalizeCareerText(query.slice(0, 2000));
  if (input.length < 2) return [];
  const words = tokens(input);
  const inputSequence = input.replace(/\bml\b/g, "machine learning").split(" ").map(word => WORD_FORMS[word] || word).filter(word => word.length > 1 && !STOP.has(word)).join(" ");
  const availableNames = available ? new Set(available.map(role => normalizeCareerText(role.name))) : null;
  return careerCatalogue.roles.filter(role => !availableNames || availableNames.has(normalizeCareerText(role.name))).map(role => {
    const names = [role.name, ...role.aliases].map(normalizeCareerText);
    const exact = names.includes(input);
    let score = exact ? 100 : 0;
    let hasNameAnchor = false;
    const evidence = new Set<string>();
    for (const name of names) {
      const nameWords = new Set([...tokens(name)].filter(word => !TITLE_WORDS.has(word)));
      const shared = overlap(words, nameWords);
      const complete = !!nameWords.size && shared.length === nameWords.size;
      const ordered = complete && (" " + inputSequence + " ").includes(" " + [...nameWords].join(" ") + " ");
      hasNameAnchor ||= complete;
      const phrase = input.length > name.length && input.includes(name) && name.length >= 6;
      // A complete multiword intent (e.g. cloud support) is stronger than a
      // generic fragment (e.g. control). Never make one common fragment a fit.
      const match = shared.length ? (nameWords.size >= 2 && complete ? 70 : 20 * shared.length / Math.max(nameWords.size, 1)) + (ordered ? 20 : 0) : 0;
      score = Math.max(score, phrase ? 70 : match);
      if (shared.length || phrase) shared.forEach(word => evidence.add(word));
    }
    for (const requirement of role.requirements) {
      const skill = skillsByKey.get(requirement.skill)!;
      const shared = overlap(words, tokens([skill.name, ...skill.aliases].join(" ")));
      if (shared.length) { score += Math.min(16, shared.length * 5); shared.forEach(word => evidence.add(word)); }
    }
    const stored = available?.find(item => normalizeCareerText(item.name) === normalizeCareerText(role.name));
    return {role, stored, exact, score, hasNameAnchor, evidence: [...evidence].slice(0, 5)};
  }).filter(item => item.exact || (item.score >= 12 && (item.hasNameAnchor || item.evidence.length >= 2))).sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score || a.role.name.localeCompare(b.role.name));
}

export function careerRequirements(roleName: string, focusSkills: {id: string; name: string}[], level: CareerLevel) {
  const role = careerForName(roleName);
  const byName = new Map((role?.requirements || []).map(item => [skillsByKey.get(item.skill)!.name, item]));
  return focusSkills.map(skill => {
    const configured = byName.get(skill.name);
    return {skill_id: skill.id, weight: configured?.importance ?? .8, required_score: configured?.target ?? 70, target: requiredScore({required_score: configured?.target ?? 70}, level), skills: {name: skill.name}, essential: !!configured?.essential};
  });
}

// Matches Python guest_catalogue ordering while leaving the original three indices stable.
const legacyDemoNames = ["Data Analyst", "Frontend Developer", "AI Applications Developer"];
export const demoCareerProfiles = [...careerCatalogue.roles].sort((a, b) => (legacyDemoNames.includes(a.name) ? legacyDemoNames.indexOf(a.name) : 100) - (legacyDemoNames.includes(b.name) ? legacyDemoNames.indexOf(b.name) : 100) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
