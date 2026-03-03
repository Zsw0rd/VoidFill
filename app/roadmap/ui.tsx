"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/components/ui/cn";
import { toast } from "@/components/toast/bus";
import { categoryFromScore, priorityScore } from "@/lib/gapLogic";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Code,
  ExternalLink,
  GitBranch,
  GraduationCap,
  LayoutList,
  Leaf,
  Loader2,
  Minus,
  Play,
  Plus,
  Sparkles,
  XCircle,
} from "lucide-react";

type RoadmapViewMode = "tree" | "list";
type CourseType = "course" | "book" | "project" | "tutorial" | "practice";
type Category = "Strong" | "Moderate" | "Weak" | "Missing";

type RoadmapCourse = {
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

type CourseAssessment = {
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

type SkillNode = {
  skill_id: string;
  name: string;
  score: number;
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

type AssessmentTarget = {
  type: "course" | "skill";
  course?: RoadmapCourse;
  skillName: string;
  skillId: string;
} | null;

const typeIcons: Record<CourseType, LucideIcon> = {
  course: GraduationCap,
  book: BookOpen,
  project: Code,
  tutorial: Play,
  practice: Code,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mixColor(progress: number, alpha?: number) {
  const t = clamp(progress / 100, 0, 1);
  const start = { r: 82, g: 82, b: 91 };
  const end = { r: 52, g: 211, b: 153 };
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return alpha == null ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function categoryTone(category: Category): "good" | "warn" | "bad" {
  if (category === "Strong") return "good";
  if (category === "Moderate") return "warn";
  return "bad";
}

function shorten(text: string, max = 22) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function difficultyBadge(difficulty: RoadmapCourse["difficulty"]) {
  if (difficulty === "beginner") return "bg-emerald-500/10 text-emerald-300";
  if (difficulty === "advanced") return "bg-rose-500/10 text-rose-300";
  return "bg-amber-500/10 text-amber-300";
}

type TreeLeafLayout = {
  course: RoadmapCourse | null;
  x: number;
  y: number;
  row: number;
  column: number;
  rowCount: number;
};

type TreeNodeLayout = {
  skill: SkillNode;
  x: number;
  y: number;
  direction: 1 | -1;
  segmentWidth: number;
  leafRows: number;
  canopyY: number;
  canopyRx: number;
  canopyRy: number;
  leaves: TreeLeafLayout[];
};

const TREE_LAYOUT = {
  sidePadding: 120,
  topPadding: 84,
  skillCardWidth: 176,
  leafWidth: 148,
  leafGapX: 16,
  leafGapY: 60,
  segmentPaddingX: 46,
  leafBaseOffsetY: 118,
  trunkClearance: 262,
  bottomPadding: 96,
};

const COURSE_PASS_THRESHOLD = 65;
const SKILL_PASS_THRESHOLD = 65;
const TREE_ZOOM_STEP = 1.14;
const TREE_MAX_ZOOM_MULTIPLIER = 1.75;

function leafColumnCount(leafCount: number) {
  if (leafCount <= 1) return 1;
  if (leafCount <= 4) return 2;
  return 3;
}

function leafRowCounts(leafCount: number, columns: number) {
  const rows = Math.ceil(leafCount / Math.max(columns, 1));
  const counts = Array.from({ length: rows }, () => 0);
  let remaining = leafCount;

  for (let row = rows - 1; row >= 0; row -= 1) {
    counts[row] = Math.min(columns, remaining);
    remaining -= counts[row];
  }

  return counts;
}

export function RoadmapClient({
  role,
  initialViewMode = "tree",
}: {
  role: any;
  initialViewMode?: RoadmapViewMode;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [roleSkills, setRoleSkills] = useState<any[]>([]);
  const [deps, setDeps] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [courses, setCourses] = useState<RoadmapCourse[]>([]);
  const [assessments, setAssessments] = useState<CourseAssessment[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<RoadmapViewMode>(initialViewMode === "list" ? "list" : "tree");
  const [savingViewMode, setSavingViewMode] = useState(false);
  const [generatingCourses, setGeneratingCourses] = useState(false);
  const [assessTarget, setAssessTarget] = useState<AssessmentTarget>(null);
  const [assessQuestions, setAssessQuestions] = useState<any[]>([]);
  const [assessIndex, setAssessIndex] = useState(0);
  const [assessAnswers, setAssessAnswers] = useState<Record<string, number>>({});
  const [assessLoading, setAssessLoading] = useState(false);
  const [assessResult, setAssessResult] = useState<any>(null);

  const roleId = role?.id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast("Not logged in");
        setRoleSkills([]);
        setDeps([]);
        setScores({});
        setCourses([]);
        setAssessments([]);
        return;
      }

      if (!roleId) {
        setRoleSkills([]);
        setDeps([]);
        setScores({});
        setCourses([]);
        setAssessments([]);
        return;
      }

      const [rs, depRows, userScores, courseRows, assessmentRows] = await Promise.all([
        supabase.from("role_skills").select("skill_id, weight, skills(name)").eq("role_id", roleId),
        supabase.from("skill_dependencies").select("prerequisite_skill_id, dependent_skill_id"),
        supabase.from("user_skill_scores").select("skill_id, score").eq("user_id", user.id),
        supabase.from("roadmap_courses").select("*").eq("user_id", user.id).order("sort_order"),
        supabase.from("course_assessments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      const firstError = rs.error || depRows.error || userScores.error || courseRows.error || assessmentRows.error;
      if (firstError) {
        toast("Load failed", firstError.message);
        return;
      }

      setRoleSkills(rs.data || []);
      setDeps(depRows.data || []);

      const nextScores: Record<string, number> = {};
      (userScores.data || []).forEach((row: any) => {
        nextScores[row.skill_id] = Number(row.score ?? 0);
      });

      setScores(nextScores);
      setCourses((courseRows.data || []) as RoadmapCourse[]);
      setAssessments((assessmentRows.data || []) as CourseAssessment[]);
    } finally {
      setLoading(false);
    }
  }, [supabase, roleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const latestAssessmentByCourse = useMemo(() => {
    const map = new Map<string, CourseAssessment>();
    assessments.forEach((assessment) => {
      if (!map.has(assessment.course_id)) {
        map.set(assessment.course_id, assessment);
      }
    });
    return map;
  }, [assessments]);

  const computed = useMemo<SkillNode[]>(() => {
    if (!roleSkills.length) return [];

    const dependencyMap = new Map<string, Set<string>>();
    deps.forEach((row: any) => {
      const set = dependencyMap.get(row.prerequisite_skill_id) || new Set<string>();
      set.add(row.dependent_skill_id);
      dependencyMap.set(row.prerequisite_skill_id, set);
    });

    const roleSkillIds = new Set(roleSkills.map((row: any) => row.skill_id));
    const coursesBySkill = new Map<string, RoadmapCourse[]>();
    courses.forEach((course) => {
      const list = coursesBySkill.get(course.skill_id) || [];
      list.push(course);
      coursesBySkill.set(course.skill_id, list);
    });

    const assessmentsByCourse = new Map<string, CourseAssessment[]>();
    assessments.forEach((assessment) => {
      const list = assessmentsByCourse.get(assessment.course_id) || [];
      list.push(assessment);
      assessmentsByCourse.set(assessment.course_id, list);
    });

    const rows = roleSkills.map((row: any) => {
      const score = Number(scores[row.skill_id] ?? 0);
      const category = categoryFromScore(score) as Category;
      const dependencySet = dependencyMap.get(row.skill_id);
      let dependencyBonus = 1;

      if (dependencySet) {
        for (const dependencySkillId of dependencySet) {
          if (roleSkillIds.has(dependencySkillId)) {
            dependencyBonus = 2;
            break;
          }
        }
      }

      const priority = priorityScore({
        score,
        roleWeight: Number(row.weight ?? 0.8),
        dependencyBonus,
      });

      const skillCourses = [...(coursesBySkill.get(row.skill_id) || [])].sort((a, b) => a.sort_order - b.sort_order);
      const skillAssessments = skillCourses.flatMap((course) => assessmentsByCourse.get(course.id) || []);
      const completedCourses = skillCourses.filter((course) => course.completed).length;
      const totalCourses = skillCourses.length;
      const courseProgress = totalCourses ? Math.round((completedCourses / totalCourses) * 100) : 0;
      const skillProgress = clamp(Math.round(score), 0, 100);
      const branchProgress = clamp(Math.round(skillProgress * 0.68 + courseProgress * 0.32), 0, 100);

      return {
        skill_id: row.skill_id,
        name: row.skills?.name || "Skill",
        score,
        category,
        role_weight: Number(row.weight ?? 0.8),
        dependency_bonus: dependencyBonus,
        priority,
        courses: skillCourses,
        assessments: skillAssessments,
        completedCourses,
        totalCourses,
        courseProgress,
        skillProgress,
        branchProgress,
      };
    });

    rows.sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
    return rows;
  }, [assessments, courses, deps, roleSkills, scores]);

  const overallProgress = computed.length
    ? Math.round(computed.reduce((sum, skill) => sum + skill.branchProgress, 0) / computed.length)
    : 0;
  const completedLeaves = computed.reduce((sum, skill) => sum + skill.completedCourses, 0);
  const totalLeaves = computed.reduce((sum, skill) => sum + skill.totalCourses, 0);
  const flourishingBranches = computed.filter((skill) => skill.branchProgress >= 80).length;

  useEffect(() => {
    if (!computed.length) {
      setSelectedSkillId(null);
      setExpanded(null);
      return;
    }

    setSelectedSkillId((current) => {
      if (current && computed.some((skill) => skill.skill_id === current)) return current;
      return computed[0].skill_id;
    });

    setExpanded((current) => {
      if (!current) return current;
      return computed.some((skill) => skill.skill_id === current) ? current : null;
    });
  }, [computed]);

  async function persistViewMode(nextMode: RoadmapViewMode) {
    if (nextMode === viewMode) return;

    const previousMode = viewMode;
    setViewMode(nextMode);
    setSavingViewMode(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from("profiles").update({ roadmap_view_mode: nextMode }).eq("id", user.id);
      if (error) throw error;
    } catch (err: any) {
      setViewMode(previousMode);
      toast("Layout save failed", err.message || "Could not save roadmap layout.");
    } finally {
      setSavingViewMode(false);
    }
  }

  async function generateCourses() {
    setGeneratingCourses(true);
    try {
      const res = await fetch("/api/ai/recommend-courses", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast("Generate failed", data.error || data.detail || "Unknown error");
        return;
      }

      toast("Courses generated", data.message || `${data.saved} resources saved.`);
      if (data.unmatched?.length) {
        console.warn("Unmatched skills:", data.unmatched);
      }

      await load();
    } catch (err: any) {
      toast("Network error", err.message);
    } finally {
      setGeneratingCourses(false);
    }
  }

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/roadmap/generate", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        toast("Generate failed", data.error || "Unknown error");
        return;
      }

      toast("Roadmap saved", "Priorities updated.");
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function startCourseAssessment(course: RoadmapCourse, skillName: string, skillId: string) {
    setAssessLoading(true);
    setAssessTarget({ type: "course", course, skillName, skillId });
    setAssessResult(null);
    setAssessAnswers({});
    setAssessIndex(0);

    try {
      const res = await fetch("/api/roadmap/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: course.id, course_title: course.title, skill_name: skillName }),
      });

      if (!res.ok) {
        toast("Assessment generation failed");
        return;
      }

      const data = await res.json();
      setAssessQuestions(data.questions || []);
    } finally {
      setAssessLoading(false);
    }
  }

  async function startSkillAssessment(skillName: string, skillId: string) {
    setAssessLoading(true);
    setAssessTarget({ type: "skill", skillName, skillId });
    setAssessResult(null);
    setAssessAnswers({});
    setAssessIndex(0);

    try {
      const skillCourses = courses.filter((course) => course.skill_id === skillId);
      const courseTitles = skillCourses.map((course) => course.title).join(", ");

      const res = await fetch("/api/roadmap/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill_name: skillName,
          course_title: `Skill assessment for ${skillName}${courseTitles ? ` covering: ${courseTitles}` : ""}`,
          is_skill_assessment: true,
        }),
      });

      if (!res.ok) {
        toast("Assessment generation failed");
        return;
      }

      const data = await res.json();
      setAssessQuestions(data.questions || []);
    } finally {
      setAssessLoading(false);
    }
  }

  async function submitAssessment() {
    if (!assessTarget) return;

    const total = assessQuestions.length;
    let correct = 0;
    assessQuestions.forEach((question) => {
      if (assessAnswers[question.id] === question.correct_index) correct += 1;
    });

    const assessScore = Math.round((correct / Math.max(total, 1)) * 100);
    const passThreshold = assessTarget.type === "course" ? COURSE_PASS_THRESHOLD : SKILL_PASS_THRESHOLD;
    const passed = assessScore >= passThreshold;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (assessTarget.type === "course" && assessTarget.course) {
      const { error: assessmentInsertError } = await supabase.from("course_assessments").insert({
        user_id: user.id,
        course_id: assessTarget.course.id,
        score: assessScore,
        total,
        passed,
        answers: assessAnswers,
      });

      if (assessmentInsertError) {
        toast("Save failed", assessmentInsertError.message);
        return;
      }

      if (passed) {
        const { error: courseUpdateError } = await supabase
          .from("roadmap_courses")
          .update({ completed: true })
          .eq("id", assessTarget.course.id);

        if (courseUpdateError) {
          toast("Course update failed", courseUpdateError.message);
          return;
        }
      }
    }

    if (assessTarget.skillId) {
      const skillId = assessTarget.skillId;
      const previousScore = scores[skillId] ?? 0;
      const nextScore = Math.round(previousScore * 0.7 + assessScore * 0.3);

      const { error: skillScoreError } = await supabase.from("user_skill_scores").upsert(
        { user_id: user.id, skill_id: skillId, score: nextScore, updated_at: new Date().toISOString() },
        { onConflict: "user_id,skill_id" },
      );

      if (skillScoreError) {
        toast("Skill update failed", skillScoreError.message);
        return;
      }

      const skillCourses = courses.filter((course) => course.skill_id === skillId);
      const completedCount = skillCourses.filter((course) => {
        if (course.completed) return true;
        return assessTarget.type === "course" && passed && course.id === assessTarget.course?.id;
      }).length;
      const courseProgress = skillCourses.length ? Math.round((completedCount / skillCourses.length) * 100) : 0;
      const branchProgress = clamp(Math.round(nextScore * 0.68 + courseProgress * 0.32), 0, 100);

      const { error: roadmapUpdateError } = await supabase
        .from("user_roadmap")
        .update({ progress: branchProgress, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("skill_id", skillId);

      if (roadmapUpdateError) {
        toast("Roadmap update failed", roadmapUpdateError.message);
        return;
      }

      setScores((current) => ({ ...current, [skillId]: nextScore }));

      if (assessTarget.type === "course" && passed && assessTarget.course) {
        setCourses((current) =>
          current.map((course) => (course.id === assessTarget.course?.id ? { ...course, completed: true } : course)),
        );
      }
    }

    setAssessResult({ score: assessScore, correct, total, passed });
  }

  function closeAssessment() {
    setAssessTarget(null);
    setAssessQuestions([]);
    setAssessResult(null);
    void load();
  }

  const activeQuestion = assessQuestions[assessIndex];
  const assessTitle =
    assessTarget?.type === "course"
      ? `Assessment: ${assessTarget.course?.title}`
      : `Skill Assessment: ${assessTarget?.skillName}`;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Roadmap</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {role ? `Target: ${role.name}` : "Select a target role to generate a roadmap."}
          </p>
        </div>

        {role && (
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
                <button
                  onClick={() => void persistViewMode("tree")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                    viewMode === "tree" ? "bg-emerald-500/15 text-emerald-200" : "text-zinc-400 hover:text-zinc-200",
                  )}
                >
                  <GitBranch className="h-4 w-4" />
                  Tree
                </button>
                <button
                  onClick={() => void persistViewMode("list")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                    viewMode === "list" ? "bg-white/10 text-zinc-100" : "text-zinc-400 hover:text-zinc-200",
                  )}
                >
                  <LayoutList className="h-4 w-4" />
                  Classic
                </button>
              </div>
              <span className="text-xs text-zinc-500">{savingViewMode ? "Saving layout..." : "Layout is saved per user."}</span>
            </div>

            <div className="flex gap-2">
              <Button variant="soft" disabled={generatingCourses} onClick={generateCourses}>
                {generatingCourses ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    AI Recommendations
                  </>
                )}
              </Button>
              <Button disabled={loading} onClick={generate}>
                {loading ? "Working..." : "Refresh priorities"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {!role && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-zinc-300">
          Go to onboarding and pick a target role to unlock the roadmap.
        </div>
      )}

      {role && computed.length > 0 && (
        <Card className="overflow-hidden border-emerald-500/15">
          <CardContent
            className="p-5"
            style={{
              background: `radial-gradient(circle at 20% 0%, ${mixColor(overallProgress, 0.16)}, transparent 45%), radial-gradient(circle at 80% 20%, ${mixColor(overallProgress, 0.08)}, transparent 38%)`,
            }}
          >
            <div className="grid gap-4 lg:grid-cols-[1.4fr,0.9fr] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm uppercase tracking-[0.18em] text-zinc-500">Living Roadmap</div>
                    <div className="text-xl font-semibold text-zinc-100">The tree gets greener as your branches mature.</div>
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-sm text-zinc-400">
                  Each branch represents a target skill. Skill tests strengthen the branch, completed resources finish the leaves,
                  and the canopy reflects overall progress.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Overall canopy growth</div>
                  <div className="text-sm text-zinc-300">{overallProgress}%</div>
                </div>
                <div className="mt-3">
                  <Progress value={overallProgress} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-lg font-semibold text-zinc-100">{computed.length}</div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Branches</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-lg font-semibold text-emerald-300">
                      {completedLeaves}/{totalLeaves || 0}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Leaves done</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-lg font-semibold text-zinc-100">{flourishingBranches}</div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Flourishing</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {role && computed.length > 0 && viewMode === "tree" && (
        <RoadmapTreeView
          overallProgress={overallProgress}
          roleName={role?.name || "Target Role"}
          skills={computed}
          selectedSkillId={selectedSkillId}
          latestAssessmentByCourse={latestAssessmentByCourse}
          onSelectSkill={(skillId) => setSelectedSkillId(skillId)}
          onOpenSkillAssessment={startSkillAssessment}
          onOpenCourseAssessment={startCourseAssessment}
        />
      )}

      {role && computed.length > 0 && viewMode === "list" && (
        <RoadmapClassicView
          skills={computed}
          expanded={expanded}
          latestAssessmentByCourse={latestAssessmentByCourse}
          onToggle={(skillId) => {
            setSelectedSkillId(skillId);
            setExpanded((current) => (current === skillId ? null : skillId));
          }}
          onOpenSkillAssessment={startSkillAssessment}
          onOpenCourseAssessment={startCourseAssessment}
        />
      )}

      {role && computed.length === 0 && !loading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-zinc-300">
          No role skills or user scores yet. Take a daily test first.
        </div>
      )}

      <AnimatePresence>
        {assessTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === event.currentTarget) closeAssessment();
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-6"
            >
              <h3 className="text-xl font-semibold">{assessTitle}</h3>

              {assessLoading && (
                <div className="mt-6 flex items-center justify-center gap-2 text-zinc-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating assessment...
                </div>
              )}

              {!assessLoading && !assessResult && activeQuestion && (
                <div className="mt-6 space-y-5">
                  <div className="flex items-center justify-between gap-4 text-sm text-zinc-400">
                    <span>
                      Question {assessIndex + 1} of {assessQuestions.length}
                    </span>
                    <span>
                      Pass mark: {assessTarget?.type === "course" ? COURSE_PASS_THRESHOLD : SKILL_PASS_THRESHOLD}%
                    </span>
                  </div>
                  <Progress value={(assessIndex / Math.max(assessQuestions.length, 1)) * 100} />
                  <div className="text-lg font-medium">{activeQuestion.prompt}</div>
                  <div className="grid gap-3">
                    {(activeQuestion.options || []).map((option: string, index: number) => {
                      const active = assessAnswers[activeQuestion.id] === index;
                      return (
                        <button
                          key={index}
                          onClick={() => setAssessAnswers((current) => ({ ...current, [activeQuestion.id]: index }))}
                          className={cn(
                            "rounded-xl border p-3 text-left transition",
                            active ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium",
                                active ? "border-emerald-400 text-emerald-300" : "border-white/20 text-zinc-400",
                              )}
                            >
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="text-sm">{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="soft" onClick={closeAssessment}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (assessAnswers[activeQuestion.id] === undefined) {
                          toast("Pick an answer");
                          return;
                        }

                        if (assessIndex + 1 < assessQuestions.length) {
                          setAssessIndex((current) => current + 1);
                          return;
                        }

                        void submitAssessment();
                      }}
                    >
                      {assessIndex + 1 < assessQuestions.length ? "Next" : "Submit"}
                    </Button>
                  </div>
                </div>
              )}

              {assessResult && (
                <div className="mt-6 space-y-5 text-center">
                  <div className={cn("text-6xl font-bold", assessResult.passed ? "text-emerald-400" : "text-rose-400")}>
                    {assessResult.score}%
                  </div>
                  <div className="text-lg font-medium">
                    {assessResult.correct}/{assessResult.total} correct
                  </div>
                  <Badge tone={assessResult.passed ? "good" : "bad"}>
                    {assessResult.passed
                      ? assessTarget?.type === "course"
                        ? "Passed. Course completed."
                        : "Passed. Skill score updated."
                      : `Not passed. ${assessTarget?.type === "course" ? "Course stays incomplete until you reach" : "You need"} ${assessTarget?.type === "course" ? COURSE_PASS_THRESHOLD : SKILL_PASS_THRESHOLD}% or higher.`}
                  </Badge>

                  <div className="mt-4 space-y-3 text-left">
                    {assessQuestions.map((question, index) => {
                      const userAnswer = assessAnswers[question.id];
                      const isCorrect = userAnswer === question.correct_index;
                      return (
                        <div
                          key={index}
                          className={cn(
                            "rounded-xl border p-3 text-sm",
                            isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {isCorrect ? (
                              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                            ) : (
                              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                            )}
                            <div>
                              <div className="font-medium">{question.prompt}</div>
                              {!isCorrect && (
                                <div className="mt-1 text-xs text-zinc-400">
                                  Correct answer: {question.options[question.correct_index]}
                                </div>
                              )}
                              {question.explanation && <div className="mt-1 text-xs text-zinc-300">{question.explanation}</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button onClick={closeAssessment}>Close</Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RoadmapTreeView(_: {
  overallProgress: number;
  roleName: string;
  skills: SkillNode[];
  selectedSkillId: string | null;
  latestAssessmentByCourse: Map<string, CourseAssessment>;
  onSelectSkill: (skillId: string) => void;
  onOpenSkillAssessment: (skillName: string, skillId: string) => void;
  onOpenCourseAssessment: (course: RoadmapCourse, skillName: string, skillId: string) => void;
}) {
  const {
    overallProgress,
    roleName,
    skills,
    selectedSkillId,
    latestAssessmentByCourse,
    onSelectSkill,
    onOpenSkillAssessment,
    onOpenCourseAssessment,
  } = _;

  const selectedSkill = skills.find((skill) => skill.skill_id === selectedSkillId) || skills[0] || null;

  const layout = useMemo(() => {
    const skillCount = Math.max(skills.length, 1);
    const nodePlans = skills.map((skill) => {
      const leafCount = Math.max(skill.totalCourses, 1);
      const columns = leafColumnCount(leafCount);
      const rowCounts = leafRowCounts(leafCount, columns);
      const widestRow = Math.max(...rowCounts, 1);
      const leafClusterWidth =
        widestRow * TREE_LAYOUT.leafWidth + Math.max(widestRow - 1, 0) * TREE_LAYOUT.leafGapX;
      const segmentWidth = Math.max(
        TREE_LAYOUT.skillCardWidth + 84,
        leafClusterWidth + TREE_LAYOUT.segmentPaddingX * 2,
      );

      return {
        skill,
        leafCount,
        rowCounts,
        leafRows: rowCounts.length,
        segmentWidth,
      };
    });

    const totalSegmentWidth = nodePlans.reduce((sum, plan) => sum + plan.segmentWidth, 0);
    const width = Math.max(1180, totalSegmentWidth + TREE_LAYOUT.sidePadding * 2);
    const startX = (width - totalSegmentWidth) / 2;
    const maxLeafRows = Math.max(...nodePlans.map((plan) => plan.leafRows), 1);
    const skillBandY =
      TREE_LAYOUT.topPadding + (maxLeafRows - 1) * TREE_LAYOUT.leafGapY + TREE_LAYOUT.leafBaseOffsetY + 18;
    const trunkTop = { x: width / 2, y: skillBandY + TREE_LAYOUT.trunkClearance };
    const root = { x: width / 2, y: trunkTop.y + 220 };
    const height = root.y + TREE_LAYOUT.bottomPadding;

    let cursor = startX;
    const nodes: TreeNodeLayout[] = nodePlans.map((plan, index) => {
      const x = cursor + plan.segmentWidth / 2;
      cursor += plan.segmentWidth;

      const direction: 1 | -1 = x >= width / 2 ? 1 : -1;
      const centerRatio = skillCount === 1 ? 0.5 : index / (skillCount - 1);
      const wave = Math.sin(centerRatio * Math.PI) * 18 + (index % 2 === 0 ? -18 : 18);
      const y = skillBandY + wave;
      const canopyRx = Math.max(112, Math.min(plan.segmentWidth * 0.42, 220));
      const canopyRy = 88 + plan.leafRows * 20;
      const canopyY = y - TREE_LAYOUT.leafBaseOffsetY - (plan.leafRows - 1) * TREE_LAYOUT.leafGapY * 0.4;

      let leafIndex = 0;
      const leaves = plan.rowCounts.flatMap((rowCount, row) => {
        const rowWidth =
          rowCount * TREE_LAYOUT.leafWidth + Math.max(rowCount - 1, 0) * TREE_LAYOUT.leafGapX;
        const rowStart = x - rowWidth / 2 + TREE_LAYOUT.leafWidth / 2;
        const rowLift = TREE_LAYOUT.leafBaseOffsetY + (plan.rowCounts.length - 1 - row) * TREE_LAYOUT.leafGapY;

        return Array.from({ length: rowCount }).map((__, column) => {
          const course = plan.skill.courses[leafIndex] || null;
          const centerOffset = column - (rowCount - 1) / 2;
          const arch = -Math.abs(centerOffset) * 8 + (plan.rowCounts.length - 1 - row) * 4;
          const sway = direction * centerOffset * 8;
          const leaf = {
            course,
            x: rowStart + column * (TREE_LAYOUT.leafWidth + TREE_LAYOUT.leafGapX) + sway,
            y: y - rowLift + arch,
            row,
            column,
            rowCount,
          };
          leafIndex += 1;
          return leaf;
        });
      });

      return {
        skill: plan.skill,
        x,
        y,
        direction,
        segmentWidth: plan.segmentWidth,
        leafRows: plan.leafRows,
        canopyY,
        canopyRx,
        canopyRy,
        leaves,
      };
    });

    return { width, height, root, trunkTop, nodes };
  }, [skills]);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fitScale = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) return 1;
    const paddedWidth = Math.max(viewportSize.width - 48, 1);
    const paddedHeight = Math.max(viewportSize.height - 48, 1);
    return Number(Math.min(paddedWidth / layout.width, paddedHeight / layout.height, 1).toFixed(4));
  }, [layout.height, layout.width, viewportSize.height, viewportSize.width]);

  const maxScale = useMemo(() => {
    return Number((fitScale * TREE_MAX_ZOOM_MULTIPLIER).toFixed(4));
  }, [fitScale]);

  const centerOffsetForScale = useCallback(
    (targetScale: number) => ({
      x: (viewportSize.width - layout.width * targetScale) / 2,
      y: (viewportSize.height - layout.height * targetScale) / 2,
    }),
    [layout.height, layout.width, viewportSize.height, viewportSize.width],
  );

  const clampOffsetForScale = useCallback(
    (nextOffset: { x: number; y: number }, targetScale: number) => {
      const scaledWidth = layout.width * targetScale;
      const scaledHeight = layout.height * targetScale;
      const edgePadding = 24;

      const minX = scaledWidth <= viewportSize.width
        ? (viewportSize.width - scaledWidth) / 2
        : viewportSize.width - scaledWidth - edgePadding;
      const maxX = scaledWidth <= viewportSize.width
        ? minX
        : edgePadding;
      const minY = scaledHeight <= viewportSize.height
        ? (viewportSize.height - scaledHeight) / 2
        : viewportSize.height - scaledHeight - edgePadding;
      const maxY = scaledHeight <= viewportSize.height
        ? minY
        : edgePadding;

      return {
        x: clamp(nextOffset.x, minX, maxX),
        y: clamp(nextOffset.y, minY, maxY),
      };
    },
    [layout.height, layout.width, viewportSize.height, viewportSize.width],
  );

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    if (!viewportSize.width || !viewportSize.height) return;

    setScale((current) => {
      const nextScale = clamp(current || fitScale, fitScale, maxScale);
      scaleRef.current = nextScale;
      return nextScale;
    });

    setOffset((current) => {
      const targetScale = clamp(scaleRef.current || fitScale, fitScale, maxScale);
      const nextOffset = current.x === 0 && current.y === 0
        ? centerOffsetForScale(targetScale)
        : clampOffsetForScale(current, targetScale);
      offsetRef.current = nextOffset;
      return nextOffset;
    });
  }, [centerOffsetForScale, clampOffsetForScale, fitScale, maxScale, viewportSize.height, viewportSize.width]);

  const zoomTo = useCallback(
    (targetScale: number, anchor?: { x: number; y: number }) => {
      if (!viewportSize.width || !viewportSize.height) return;
      const safeCurrentScale = scaleRef.current || fitScale;
      const nextScale = clamp(targetScale, fitScale, maxScale);
      const anchorPoint = anchor || {
        x: viewportSize.width / 2,
        y: viewportSize.height / 2,
      };

      const worldX = (anchorPoint.x - offsetRef.current.x) / safeCurrentScale;
      const worldY = (anchorPoint.y - offsetRef.current.y) / safeCurrentScale;
      const nextOffset = clampOffsetForScale(
        {
          x: anchorPoint.x - worldX * nextScale,
          y: anchorPoint.y - worldY * nextScale,
        },
        nextScale,
      );

      scaleRef.current = nextScale;
      offsetRef.current = nextOffset;
      setScale(nextScale);
      setOffset(nextOffset);
    },
    [clampOffsetForScale, fitScale, maxScale, viewportSize.height, viewportSize.width],
  );

  const handleCanvasWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    const anchor = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const direction = event.deltaY < 0 ? TREE_ZOOM_STEP : 1 / TREE_ZOOM_STEP;
    zoomTo(scaleRef.current * direction, anchor);
  }, [zoomTo]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const listener = (event: WheelEvent) => handleCanvasWheel(event);
    node.addEventListener("wheel", listener, { passive: false });

    return () => {
      node.removeEventListener("wheel", listener);
    };
  }, [handleCanvasWheel]);

  useEffect(() => {
    if (!isCanvasHovered) return;

    const body = document.body;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const previousOverflow = body.style.overflow;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousLeft = body.style.left;
    const previousRight = body.style.right;
    const previousWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.left = previousLeft;
      body.style.right = previousRight;
      body.style.width = previousWidth;
      window.scrollTo(scrollX, scrollY);
    };
  }, [isCanvasHovered]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("[data-tree-interactive='true']")) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offsetRef.current.x,
      originY: offsetRef.current.y,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const nextOffset = clampOffsetForScale(
      {
        x: drag.originX + (event.clientX - drag.startX),
        y: drag.originY + (event.clientY - drag.startY),
      },
      scaleRef.current,
    );

    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const zoomPercent = fitScale ? Math.round((scale / fitScale) * 100) : 100;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-emerald-500/10">
        <CardHeader className="border-b border-white/10 p-5 pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Skill Tree</h2>
              <p className="mt-1 text-sm text-zinc-400">Tap a branch to inspect that skill and its leaves.</p>
            </div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400">
              Trunk growth: {overallProgress}% across {skills.length} branches
            </div>
          </div>
        </CardHeader>

        <CardContent
          className="relative overflow-hidden p-0"
          onPointerEnter={() => setIsCanvasHovered(true)}
          onPointerLeave={() => {
            setIsCanvasHovered(false);
            setIsDragging(false);
          }}
        >
          <div className="absolute left-4 top-4 z-20 rounded-2xl border border-white/10 bg-black/45 px-3 py-2 text-xs text-zinc-400 backdrop-blur">
            Scroll to zoom. Drag empty canvas to pan. Leaves open the resource in a new tab.
          </div>
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/45 p-2 backdrop-blur">
            <button
              onClick={() => zoomTo(scale / TREE_ZOOM_STEP)}
              disabled={scale <= fitScale + 0.0001}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              data-tree-interactive="true"
              title="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => zoomTo(fitScale)}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/15"
              data-tree-interactive="true"
              title="Fit tree to canvas"
            >
              Fit
            </button>
            <button
              onClick={() => zoomTo(scale * TREE_ZOOM_STEP)}
              disabled={scale >= maxScale - 0.0001}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              data-tree-interactive="true"
              title="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <div className="min-w-14 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-zinc-300">
              {zoomPercent}%
            </div>
          </div>

          <div
            ref={viewportRef}
            className={cn(
              "relative h-[min(78vh,840px)] overflow-hidden overscroll-contain bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.08),transparent_38%),linear-gradient(180deg,rgba(9,14,13,0.98),rgba(5,6,6,0.98))] touch-none",
              isDragging ? "cursor-grabbing" : "cursor-grab",
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: `${layout.width}px`,
                height: `${layout.height}px`,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <div className="relative" style={{ width: `${layout.width}px`, height: `${layout.height}px` }}>
              <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${layout.width} ${layout.height}`} fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="forest-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(7, 12, 10, 0.92)" />
                    <stop offset="60%" stopColor="rgba(6, 8, 8, 0.32)" />
                    <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
                  </linearGradient>
                  <linearGradient id="trunk-bark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(88, 59, 33, 0.95)" />
                    <stop offset="100%" stopColor="rgba(45, 28, 18, 0.95)" />
                  </linearGradient>
                  <radialGradient id="ground-haze" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={mixColor(overallProgress, 0.18)} />
                    <stop offset="100%" stopColor="rgba(16, 24, 21, 0)" />
                  </radialGradient>
                </defs>

                <rect x="0" y="0" width={layout.width} height={layout.height} fill="url(#forest-bg)" />
                <ellipse cx={layout.width / 2} cy={layout.height / 2 - 70} rx="420" ry="240" fill={mixColor(overallProgress, 0.05)} />
                <ellipse cx={layout.width / 2} cy={layout.height / 2 - 110} rx="300" ry="180" fill={mixColor(overallProgress, 0.08)} />
                <ellipse cx={layout.width / 2} cy={layout.height - 54} rx={layout.width * 0.34} ry="82" fill="url(#ground-haze)" />
                <ellipse cx={layout.width / 2} cy={layout.height - 36} rx={layout.width * 0.27} ry="30" fill="rgba(12, 22, 19, 0.92)" />

                {[-2, -1, 1, 2].map((spread) => {
                  const rootPath = `M ${layout.root.x} ${layout.root.y - 14} C ${layout.root.x + spread * 34} ${layout.root.y - 2}, ${layout.root.x + spread * 82} ${layout.root.y + 8}, ${layout.root.x + spread * 126} ${layout.root.y + 38}`;
                  return (
                    <path
                      key={`root-${spread}`}
                      d={rootPath}
                      stroke="rgba(63, 42, 28, 0.55)"
                      strokeWidth={Math.abs(spread) === 1 ? 10 : 7}
                      strokeLinecap="round"
                    />
                  );
                })}

                {(() => {
                  const trunkPath = `M ${layout.root.x} ${layout.root.y} C ${layout.root.x - 10} ${layout.root.y - 92}, ${layout.trunkTop.x + 8} ${layout.trunkTop.y + 128}, ${layout.trunkTop.x} ${layout.trunkTop.y}`;
                  return (
                    <>
                      <path d={trunkPath} stroke="rgba(255,255,255,0.06)" strokeWidth="30" strokeLinecap="round" />
                      <path d={trunkPath} stroke="url(#trunk-bark)" strokeWidth="22" strokeLinecap="round" />
                      <path
                        d={trunkPath}
                        stroke={mixColor(overallProgress, 0.86)}
                        strokeWidth="8"
                        strokeLinecap="round"
                        pathLength={100}
                        strokeDasharray={`${overallProgress} 100`}
                      />
                    </>
                  );
                })()}

                {layout.nodes.map((node) => (
                  <g key={`canopy-${node.skill.skill_id}`}>
                    <ellipse
                      cx={node.x}
                      cy={node.canopyY}
                      rx={node.canopyRx}
                      ry={node.canopyRy}
                      fill={mixColor(node.skill.branchProgress, 0.12)}
                      stroke={mixColor(node.skill.branchProgress, 0.14)}
                    />
                    <ellipse
                      cx={node.x}
                      cy={node.canopyY - 8}
                      rx={node.canopyRx * 0.78}
                      ry={node.canopyRy * 0.76}
                      fill={mixColor(node.skill.branchProgress, 0.16)}
                    />
                    {node.leaves.slice(0, 6).map((leaf, index) => (
                      <circle
                        key={`fruit-${node.skill.skill_id}-${index}`}
                        cx={leaf.x + (index % 2 === 0 ? 12 : -10)}
                        cy={leaf.y - 16 - (index % 3) * 4}
                        r="4"
                        fill={mixColor(node.skill.branchProgress, 0.65)}
                      />
                    ))}
                  </g>
                ))}

                {layout.nodes.map((node) => {
                  const branchPath = `M ${layout.trunkTop.x} ${layout.trunkTop.y} C ${layout.trunkTop.x + node.direction * 54} ${layout.trunkTop.y - 94}, ${node.x - node.direction * 84} ${node.y + 140}, ${node.x} ${node.y}`;
                  return (
                    <g key={node.skill.skill_id}>
                      <path d={branchPath} stroke="rgba(56, 37, 25, 0.78)" strokeWidth="16" strokeLinecap="round" />
                      <path d={branchPath} stroke="rgba(255,255,255,0.06)" strokeWidth="3" strokeLinecap="round" />
                      <path
                        d={branchPath}
                        stroke={mixColor(node.skill.branchProgress, 0.88)}
                        strokeWidth="7"
                        strokeLinecap="round"
                        pathLength={100}
                        strokeDasharray={`${node.skill.branchProgress} 100`}
                      />

                      {node.leaves.map((leaf, index) => {
                        const lastAssessment = leaf.course ? latestAssessmentByCourse.get(leaf.course.id) : null;
                        const leafProgress = leaf.course?.completed ? 100 : 0;
                        const leafColor = leaf.course?.completed
                          ? mixColor(100)
                          : lastAssessment && !lastAssessment.passed
                            ? "rgba(244, 63, 94, 0.92)"
                            : "rgba(148, 163, 184, 0.46)";
                        const branchPull = 16 + Math.abs(leaf.x - node.x) * 0.18;
                        const leafPath = `M ${node.x} ${node.y} C ${node.x + node.direction * branchPull} ${node.y - 12}, ${leaf.x - node.direction * 18} ${leaf.y + 22}, ${leaf.x} ${leaf.y}`;

                        return (
                          <g key={leaf.course?.id || `${node.skill.skill_id}-leaf-${index}`}>
                            <path d={leafPath} stroke="rgba(72, 47, 31, 0.72)" strokeWidth="5" strokeLinecap="round" />
                            <path d={leafPath} stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" strokeLinecap="round" />
                            <path
                              d={leafPath}
                              stroke={leafColor}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              pathLength={100}
                              strokeDasharray={`${leafProgress} 100`}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>

              <div
                className="absolute rounded-[28px] border px-4 py-3 text-center shadow-xl backdrop-blur"
                style={{
                  left: `${layout.root.x}px`,
                  top: `${layout.height - 118}px`,
                  transform: "translate(-50%, -50%)",
                  borderColor: mixColor(overallProgress, 0.35),
                  background: `linear-gradient(180deg, ${mixColor(overallProgress, 0.18)}, rgba(10, 10, 10, 0.92))`,
                  boxShadow: `0 24px 60px ${mixColor(overallProgress, 0.16)}`,
                }}
              >
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Root</div>
                <div className="mt-1 text-sm font-semibold text-zinc-100">{roleName}</div>
                <div className="mt-1 text-xs text-zinc-400">Canopy {overallProgress}% grown</div>
              </div>

              {layout.nodes.map((node) => {
                const active = node.skill.skill_id === selectedSkillId;
                return (
                  <button
                    key={node.skill.skill_id}
                    onClick={() => onSelectSkill(node.skill.skill_id)}
                    className="absolute w-44 rounded-[26px] border px-4 py-3 text-left shadow-xl backdrop-blur transition hover:border-white/30"
                    data-tree-interactive="true"
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      transform: "translate(-50%, -50%)",
                      borderColor: active ? mixColor(node.skill.branchProgress, 0.72) : mixColor(node.skill.branchProgress, 0.28),
                      background: active
                        ? `linear-gradient(180deg, ${mixColor(node.skill.branchProgress, 0.26)}, rgba(12, 12, 12, 0.9))`
                        : `linear-gradient(180deg, ${mixColor(node.skill.branchProgress, 0.14)}, rgba(12, 12, 12, 0.88))`,
                      boxShadow: active ? `0 22px 50px ${mixColor(node.skill.branchProgress, 0.18)}` : "none",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-semibold text-zinc-100">{node.skill.name}</div>
                      <Badge tone={categoryTone(node.skill.category)}>{node.skill.category}</Badge>
                    </div>
                    <div className="mt-3 text-xs text-zinc-400">
                      Skill {node.skill.skillProgress}% - Leaves {node.skill.completedCourses}/{node.skill.totalCourses || 0}
                    </div>
                    <div className="mt-2">
                      <Progress value={node.skill.branchProgress} />
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">Branch growth {node.skill.branchProgress}%</div>
                  </button>
                );
              })}

              {layout.nodes.flatMap((node) =>
                node.leaves.map((leaf, index) => {
                  const course = leaf.course;
                  const lastAssessment = course ? latestAssessmentByCourse.get(course.id) : null;
                  const completed = course?.completed ?? false;
                  const failed = Boolean(lastAssessment && !lastAssessment.passed && !completed);
                  const Icon = course ? typeIcons[course.type] : Leaf;
                  const leafClassName = "absolute flex w-36 items-center gap-2 rounded-full border px-3 py-2 text-left text-xs shadow-lg backdrop-blur transition hover:border-white/25";
                  const leafStyle = {
                    left: `${leaf.x}px`,
                    top: `${leaf.y}px`,
                    transform: "translate(-50%, -50%)",
                    borderColor: completed ? mixColor(100, 0.34) : failed ? "rgba(244, 63, 94, 0.35)" : "rgba(255, 255, 255, 0.1)",
                    background: completed
                      ? `linear-gradient(180deg, ${mixColor(100, 0.18)}, rgba(8, 8, 8, 0.88))`
                      : failed
                        ? "linear-gradient(180deg, rgba(244, 63, 94, 0.12), rgba(8, 8, 8, 0.88))"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(8, 8, 8, 0.88))",
                  } as CSSProperties;
                  const leafContent = (
                    <>
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border",
                          completed
                            ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                            : failed
                              ? "border-rose-400/30 bg-rose-500/15 text-rose-300"
                              : "border-white/10 bg-white/5 text-zinc-400",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-zinc-100">{course ? shorten(course.title) : "Awaiting resources"}</div>
                        <div className="truncate text-[11px] text-zinc-500">
                          {course ? (completed ? "Completed leaf" : failed ? "Needs review" : "Open resource") : "Generate recommendations"}
                        </div>
                      </div>
                    </>
                  );

                  if (course?.url) {
                    return (
                      <a
                        key={course.id}
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={course.title}
                        className={leafClassName}
                        style={leafStyle}
                        onMouseEnter={() => onSelectSkill(node.skill.skill_id)}
                        onFocus={() => onSelectSkill(node.skill.skill_id)}
                        data-tree-interactive="true"
                      >
                        {leafContent}
                      </a>
                    );
                  }

                  return (
                    <button
                      key={course?.id || `${node.skill.skill_id}-leaf-button-${index}`}
                      onClick={() => onSelectSkill(node.skill.skill_id)}
                      title={course?.title || "Awaiting resources"}
                      className={leafClassName}
                      style={leafStyle}
                      data-tree-interactive="true"
                    >
                      {leafContent}
                    </button>
                  );
                }),
              )}
            </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSkill && (
        <Card className="border-emerald-500/10">
          <CardHeader className="p-5 pb-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">{selectedSkill.name}</h3>
                  <Badge tone={categoryTone(selectedSkill.category)}>{selectedSkill.category}</Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  This branch gets stronger through tests and its leaves finish as resources are completed.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right text-sm">
                <div className="text-zinc-100">Branch progress {selectedSkill.branchProgress}%</div>
                <div className="mt-1 text-xs text-zinc-500">
                  Skill {selectedSkill.skillProgress}% - Resources {selectedSkill.completedCourses}/{selectedSkill.totalCourses || 0}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <SkillDetailPanel
              skill={selectedSkill}
              latestAssessmentByCourse={latestAssessmentByCourse}
              onOpenSkillAssessment={onOpenSkillAssessment}
              onOpenCourseAssessment={onOpenCourseAssessment}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RoadmapClassicView(_: {
  skills: SkillNode[];
  expanded: string | null;
  latestAssessmentByCourse: Map<string, CourseAssessment>;
  onToggle: (skillId: string) => void;
  onOpenSkillAssessment: (skillName: string, skillId: string) => void;
  onOpenCourseAssessment: (course: RoadmapCourse, skillName: string, skillId: string) => void;
}) {
  const { skills, expanded, latestAssessmentByCourse, onToggle, onOpenSkillAssessment, onOpenCourseAssessment } = _;

  return (
    <div className="space-y-3">
      {skills.map((skill) => {
        const isExpanded = expanded === skill.skill_id;

        return (
          <Card key={skill.skill_id} className="overflow-hidden bg-white/5">
            <button onClick={() => onToggle(skill.skill_id)} className="w-full p-5 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold">{skill.name}</div>
                    <Badge tone={categoryTone(skill.category)}>{skill.category}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                    <span>Score: {skill.score}%</span>
                    <span>Priority: {skill.priority}</span>
                    <span>
                      Leaves: {skill.completedCourses}/{skill.totalCourses || 0}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Progress value={skill.branchProgress} />
                    <div className="mt-1 text-xs text-zinc-500">
                      Branch {skill.branchProgress}% - Skill {skill.skillProgress}% - Resources {skill.courseProgress}%
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5 text-zinc-400" /> : <ChevronDown className="h-5 w-5 text-zinc-400" />}
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <CardContent className="border-t border-white/5 px-5 pb-5 pt-0">
                    <div className="pt-5">
                      <SkillDetailPanel
                        skill={skill}
                        latestAssessmentByCourse={latestAssessmentByCourse}
                        onOpenSkillAssessment={onOpenSkillAssessment}
                        onOpenCourseAssessment={onOpenCourseAssessment}
                      />
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}

function SkillDetailPanel(_: {
  skill: SkillNode;
  latestAssessmentByCourse: Map<string, CourseAssessment>;
  onOpenSkillAssessment: (skillName: string, skillId: string) => void;
  onOpenCourseAssessment: (course: RoadmapCourse, skillName: string, skillId: string) => void;
}) {
  const { skill, latestAssessmentByCourse, onOpenSkillAssessment, onOpenCourseAssessment } = _;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[0.95fr,1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Branch health</div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-lg font-semibold text-zinc-100">{skill.skillProgress}%</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">Skill score</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-lg font-semibold text-zinc-100">{skill.completedCourses}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">Leaves done</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-lg font-semibold text-zinc-100">{skill.priority}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">Priority</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={skill.branchProgress} />
          </div>
          <div className="mt-2 text-sm text-zinc-500">
            Branch progress blends test mastery and completed resources so the tree stays responsive to both.
          </div>
        </div>

        <button
          onClick={() => onOpenSkillAssessment(skill.name, skill.skill_id)}
          className="flex w-full items-center justify-center gap-3 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-indigo-300 transition hover:bg-indigo-500/10"
        >
          <ClipboardCheck className="h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">Take Skill Assessment</div>
            <div className="text-sm text-indigo-200/70">
              Push this branch forward with a focused Gemini test for {skill.name}. Passing is {SKILL_PASS_THRESHOLD}%.
            </div>
          </div>
        </button>
      </div>

      {skill.courses.length > 0 ? (
        <div className="space-y-3">
          {skill.courses.map((course) => {
            const Icon = typeIcons[course.type] || BookOpen;
            const lastAssessment = latestAssessmentByCourse.get(course.id);
            const completed = course.completed;

            return (
              <div
                key={course.id}
                className={cn(
                  "rounded-2xl border p-4",
                  completed ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/10 bg-white/5",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "rounded-2xl p-2",
                      completed ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-zinc-400",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium">{course.title}</div>
                      {completed && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />}
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {course.provider || "Unknown provider"}
                      {course.estimated_hours ? ` - ~${course.estimated_hours}h` : ""}
                    </div>
                    {course.description && <div className="mt-1 text-xs text-zinc-500">{course.description}</div>}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs", difficultyBadge(course.difficulty))}>
                        {course.difficulty || "intermediate"}
                      </span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">{course.type}</span>
                      {lastAssessment && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs",
                            lastAssessment.passed ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300",
                          )}
                        >
                          Last: {lastAssessment.score}% {lastAssessment.passed ? "Passed" : "Retry"}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {course.url && (
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/10"
                          title="Open resource"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open resource
                        </a>
                      )}
                      {!completed && (
                        <button
                          onClick={() => onOpenCourseAssessment(course, skill.name, skill.skill_id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-500/20"
                          title="Mark complete with AI test"
                        >
                          <GraduationCap className="h-3.5 w-3.5" />
                          Mark complete
                        </button>
                      )}
                    </div>
                    {!completed && (
                      <div className="mt-2 text-xs text-zinc-500">
                        Mark complete runs a Gemini assessment on this course. The leaf is only completed after scoring {COURSE_PASS_THRESHOLD}% or higher.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-zinc-400">
          No resources yet. Use <strong>AI Recommendations</strong> above to generate the leaves for this branch.
        </div>
      )}
    </div>
  );
}
