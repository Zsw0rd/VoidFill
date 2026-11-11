import { isUngradedResource } from "./resourceLearningScope";

export type RoadmapCourseProgress = { completed: boolean; url?: string | null };

/** Reviewed guides are optional context, so neither completed nor uncompleted
 * guides contribute to the assessed-resource fraction. Unknown legacy URLs keep
 * their existing behaviour; an empty assessed set retains the 68% mastery cap. */
export function roadmapProgress(score: number, courses: readonly RoadmapCourseProgress[]) {
  const mastery = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  const assessed = courses.filter(course => !isUngradedResource(course.url));
  const resources = assessed.length ? assessed.filter(course => course.completed).length / assessed.length * 100 : 0;
  return Math.round(mastery * 0.68 + resources * 0.32);
}
