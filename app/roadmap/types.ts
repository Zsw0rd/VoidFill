export type CourseType = "course" | "book" | "project" | "tutorial" | "practice";
export type Category = "Strong" | "Moderate" | "Weak" | "Missing";

export type RoadmapCourse = {
  id: string;
  user_id: string;
  skill_id: string;
  title: string;
  type: CourseType;
  provider: string | null;
  url: string | null;
  estimated_hours: number | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  description: string | null;
  sort_order: number;
  completed: boolean;
  created_at: string;
};

export type CourseAssessment = {
  id: string;
  user_id: string;
  course_id: string;
  score: number;
  total: number;
  passed: boolean;
  attempt_number: number;
  answers: Record<string, number> | null;
  created_at: string;
};

export type SkillNode = {
  skill_id: string;
  name: string;
  score: number;
  assessed: boolean;
  category: Category;
  role_weight: number;
  dependency_bonus: number;
  priority: number;
  courses: RoadmapCourse[];
  assessments: CourseAssessment[];
  completedCourses: number;
  totalCourses: number;
  courseProgress: number;
  skillProgress: number;
  branchProgress: number;
};
