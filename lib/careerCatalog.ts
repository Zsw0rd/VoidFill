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
const WORD_FORMS: Record<string, string> = { interfaces: "interface", apis: "api", databases: "database", networks: "networking", scientist: "science", scientists: "science", designer: "design", bookkeeper: "bookkeeping", analytics: "analysis", modelling: "modeling", workflows: "workflow", campaigns: "campaign", prototypes: "prototype", experiments: "experiment", systems: "system", applications: "application", pipelines: "pipeline", processes: "process", coordinating: "coordinate", coordination: "coordinate", coordinates: "coordinate", querying: "query", cleaning: "clean", planning: "plan", planned: "plan", testing: "test", tested: "test", writing: "write", written: "write", diagnosing: "diagnose", diagnosis: "diagnose", designing: "design", maintaining: "maintain", maintenance: "maintain", troubleshooting: "troubleshoot", comparing: "compare", comparison: "compare", measuring: "measure", measurement: "measure", analysing: "analysis", analyzing: "analysis", analysis: "analysis" };
const TITLE_DERIVATIONS: Record<string,string> = {coordinator:"coordinate",coordinators:"coordinate",adoption:"adopt",adopting:"adopt"};
const wordForm = (word: string) => TITLE_DERIVATIONS[word] || WORD_FORMS[word] || (word.length > 4 && word.endsWith("ies") ? word.slice(0,-3)+"y" : word.length > 4 && word.endsWith("s") && !/(ss|us|is)$/.test(word) ? word.slice(0,-1) : word);
const tokens = (value: string) => new Set(normalizeCareerText(value).replace(/\bml\b/g, "machine learning").split(" ").map(wordForm).filter(word => word.length > 1 && !STOP.has(word)));
const overlap = (a: Set<string>, b: Set<string>) => [...a].filter(value => b.has(value));
// A broad fragment such as "people" or "data" is not a job intention by itself.
// Exact full titles/aliases still win, and narrower terms such as payroll retain
// their useful anchors. This list describes broad fields, not evaluation queries.
const BROAD_NAME_WORDS = new Set("people business data software product project quality management operations operation learning marketing customer support design financial account social content talent employee engineering technical service production".split(" "));
const taskDocuments = new Map(careerCatalogue.roles.map(role => [role.id,tokens([
  role.curriculum.case, role.activity.title, role.activity.instructions,
  ...[...role.curriculum.foundation.milestones,...role.curriculum.intermediate.milestones].flatMap(milestone=>[milestone.title,milestone.outcome,milestone.deliverable,...milestone.checks]),
].join(" "))]));
const taskDocumentFrequency = new Map<string,number>();
for (const document of taskDocuments.values()) for (const word of document) taskDocumentFrequency.set(word,(taskDocumentFrequency.get(word)||0)+1);
const taskWeight = (word:string) => Math.log((careerCatalogue.roles.length+1)/((taskDocumentFrequency.get(word)||0)+1));

/** Explainable suggestions; scores are ranking signals, never fit probabilities. */
export function matchCareers(query: string, available?: StoredCareer[]) {
  // A trailing "rather than" clause names an alternative the person excluded;
  // don't count its nouns as positive evidence. This is deliberately narrow,
  // not a claim to understand arbitrary negation or complex career narratives.
  const positive=query.slice(0,2000).split(/\brather\s+than\b/i)[0].trim();
  const input = normalizeCareerText(positive || query.slice(0,2000));
  if (input.length < 2) return [];
  const words = tokens(input);
  const inputSequence = input.replace(/\bml\b/g, "machine learning").split(" ").map(wordForm).filter(word => word.length > 1 && !STOP.has(word)).join(" ");
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
      const complete = !!nameWords.size && shared.length === nameWords.size && (nameWords.size > 1 || !BROAD_NAME_WORDS.has([...nameWords][0]));
      const ordered = complete && (" " + inputSequence + " ").includes(" " + [...nameWords].join(" ") + " ");
      const phrase = input.length > name.length && input.includes(name) && name.length >= 6;
      hasNameAnchor ||= complete || phrase;
      // A complete multiword intent (e.g. cloud support) is stronger than a
      // generic fragment (e.g. control). Never make one common fragment a fit.
      const broadOnly=shared.length>0 && shared.every(word=>BROAD_NAME_WORDS.has(word));
      const match = shared.length ? (nameWords.size >= 2 && complete ? 70 : (broadOnly?8:20) * shared.length / Math.max(nameWords.size, 1)) + (ordered ? 20 : 0) : 0;
      score = Math.max(score, phrase ? 70 : match);
      if (shared.length || phrase) shared.forEach(word => evidence.add(word));
    }
    let matchedSkills=0;
    for (const requirement of role.requirements) {
      const skill = skillsByKey.get(requirement.skill)!;
      const shared = overlap(words, tokens([skill.name, ...skill.aliases].join(" ")));
      if (shared.length) { matchedSkills++; score += Math.min(16, shared.length * 5); shared.forEach(word => evidence.add(word)); }
    }
    score+=Math.min(18,Math.max(0,matchedSkills-1)*6);
    // Public, role-specific tasks add inspectable evidence for narratives that
    // omit a formal job title. Ignore ubiquitous curriculum words and require
    // multiple substantive matches before giving this evidence a ranking boost.
    const taskEvidence=overlap(words,taskDocuments.get(role.id)!).filter(word=>taskWeight(word)>=1.2);
    if (taskEvidence.length>=2) {
      score+=Math.min(24,taskEvidence.reduce((sum,word)=>sum+taskWeight(word)*2,0));
      taskEvidence.forEach(word=>evidence.add(word));
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
