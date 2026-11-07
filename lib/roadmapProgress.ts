export function roadmapProgress(score: number, courses: { completed: boolean }[]) {
  const mastery = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  const resources = courses.length ? courses.filter(course => course.completed).length / courses.length * 100 : 0;
  return Math.round(mastery * 0.68 + resources * 0.32);
}
