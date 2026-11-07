export type PlanSkill = {
  id: string;
  name: string;
  score: number | null;
  target: number;
  importance: number;
};
export type PlanDependency = { prerequisite_skill_id: string; dependent_skill_id: string };
export type RankedPlanSkill = PlanSkill & { reason: string; prerequisiteFor: string[] };

/** A transparent learning order, not a prediction of employability or time to mastery. */
export function rankLearningSkills(skills: PlanSkill[], dependencies: PlanDependency[] = []): RankedPlanSkill[] {
  const unique = [...new Map(skills.map(skill => [skill.id, skill])).values()];
  const byId = new Map(unique.map(skill => [skill.id, skill]));
  const underTarget = (skill: PlanSkill) => skill.score === null || skill.score < skill.target;
  return unique.map(skill => {
    const prerequisiteFor = [...new Set(dependencies
      .filter(row => row.prerequisite_skill_id === skill.id && row.dependent_skill_id !== skill.id)
      .map(row => byId.get(row.dependent_skill_id))
      .filter((item): item is PlanSkill => !!item && underTarget(item))
      .map(item => item.name))].sort();
    const reason = skill.score === null
      ? `No knowledge baseline yet${prerequisiteFor.length ? `; also supports ${prerequisiteFor.join(", ")}` : "."}`
      : skill.score < skill.target
        ? `${skill.score}/100 against your ${skill.target}/100 learning target${prerequisiteFor.length ? `; supports ${prerequisiteFor.join(", ")}` : "."}`
        : "Learning target reached. Revisit it through practical work and later reassessment.";
    const gap = Math.max(0, skill.target - (skill.score ?? 0));
    const priority = underTarget(skill)
      ? (skill.score === null ? 100 : gap) * Math.max(.1, skill.importance) * (prerequisiteFor.length ? 1.5 : 1)
      : -1;
    return { ...skill, prerequisiteFor, reason, priority };
  }).sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name))
    .map(({ priority: _priority, ...skill }) => skill);
}

export type WeeklyAction = { key: string; kind: string; title: string; description: string; href: string; action: string };

export function weeklyLearningRoute(skills: RankedPlanSkill[], dailyDone: boolean): WeeklyAction[] {
  const next = skills[0];
  if (!next) return [{ key: "direction", kind: "Direction", title: "Choose a learning direction", description: "Pick a career profile or build a personal goal from supported focus skills.", href: "/careers", action: "Explore careers" }];
  const branch = `/roadmap?skill=${encodeURIComponent(next.id)}#learning-map`;
  return [
    { key: "baseline", kind: "Knowledge", title: dailyDone ? "Review and practice" : skills.some(skill => skill.score !== null) ? "Check what you remember" : "Find your starting point", description: dailyDone ? "Your daily check is complete. Practice the areas that need attention." : `Start a short knowledge check. ${next.name} is a useful area to examine.`, href: dailyDone ? "/practice-test" : "/daily-test", action: dailyDone ? "Open practice lab" : "Take daily check" },
    { key: "learn", kind: "Learning", title: `Build ${next.name}`, description: next.reason, href: branch, action: "Open this branch" },
    { key: "build", kind: "Practical work", title: "Turn learning into evidence", description: "Work through your career activity. Save a draft, then choose whether to share it with your assigned mentor.", href: "/practical", action: "Open practical studio" },
    { key: "review", kind: "Feedback", title: "Reflect, revise, reassess", description: "Use your activity rubric and any mentor feedback to improve your work, then revisit the knowledge check.", href: "/practical", action: "Review your work" },
  ];
}
