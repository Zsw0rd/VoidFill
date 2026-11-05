"use client";

import "./atlas.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent } from "@/components/ui/card";
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
  Map as MapIcon,
  RefreshCw,
  GraduationCap,
  LayoutList,
  Loader2,
  Play,
  Sparkles,
  XCircle,
} from "lucide-react";

import { QuestionOptions } from "@/components/QuestionOptions";
import { FocusDialog } from "@/components/FocusDialog";
import { LearningAtlas } from "./atlas-canvas";
import type { Category, CourseAssessment, CourseType, RoadmapCourse, SkillNode } from "./types";

type RoadmapViewMode = "tree" | "list";
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

function categoryTone(category: Category): "good" | "warn" | "bad" {
  if (category === "Strong") return "good";
  if (category === "Moderate") return "warn";
  return "bad";
}

function difficultyBadge(difficulty: RoadmapCourse["difficulty"]) {
  if (difficulty === "beginner") return "bg-emerald-500/10 text-forest";
  if (difficulty === "advanced") return "bg-rose-500/10 text-rust";
  return "bg-amber-500/10 text-amber-800";
}

const COURSE_PASS_THRESHOLD = 65;
const SKILL_PASS_THRESHOLD = 65;
export function RoadmapClient({
  role,
  initialViewMode = "tree",
}: {
  role: any;
  initialViewMode?: RoadmapViewMode;
}) {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [roleSkills, setRoleSkills] = useState<any[]>([]);
  const [deps, setDeps] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [courses, setCourses] = useState<RoadmapCourse[]>([]);
  const [assessments, setAssessments] = useState<CourseAssessment[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<RoadmapViewMode>(
    initialViewMode === "list" ? "list" : "tree",
  );
  const [savingViewMode, setSavingViewMode] = useState(false);
  const [generatingCourses, setGeneratingCourses] = useState(false);
  const [assessTarget, setAssessTarget] = useState<AssessmentTarget>(null);
  const [assessQuestions, setAssessQuestions] = useState<any[]>([]);
  const [assessToken, setAssessToken] = useState("");
  const [assessIndex, setAssessIndex] = useState(0);
  const [assessAnswers, setAssessAnswers] = useState<Record<string, number>>(
    {},
  );
  const [assessLoading, setAssessLoading] = useState(false);
  const [assessResult, setAssessResult] = useState<any>(null);
  const assessmentRequest = useRef<AbortController | null>(null);
  const assessmentVersion = useRef(0);

  useEffect(() => () => assessmentRequest.current?.abort(), []);

  const roleId = role?.id;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
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

      const [rs, depRows, userScores, courseRows, assessmentRows] =
        await Promise.all([
          supabase
            .from("role_skills")
            .select("skill_id, weight, skills(name)")
            .eq("role_id", roleId),
          supabase
            .from("skill_dependencies")
            .select("prerequisite_skill_id, dependent_skill_id"),
          supabase
            .from("user_skill_scores")
            .select("skill_id, score")
            .eq("user_id", user.id),
          supabase
            .from("roadmap_courses")
            .select("*")
            .eq("user_id", user.id)
            .order("sort_order"),
          supabase
            .from("course_assessments")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

      const firstError =
        rs.error ||
        depRows.error ||
        userScores.error ||
        courseRows.error ||
        assessmentRows.error;
      if (firstError) {
        setLoadError(firstError.message || "Your roadmap could not be loaded.");
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
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Your roadmap could not be loaded.");
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
      const set =
        dependencyMap.get(row.prerequisite_skill_id) || new Set<string>();
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

      const skillCourses = [...(coursesBySkill.get(row.skill_id) || [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      const skillAssessments = skillCourses.flatMap(
        (course) => assessmentsByCourse.get(course.id) || [],
      );
      const completedCourses = skillCourses.filter(
        (course) => course.completed,
      ).length;
      const totalCourses = skillCourses.length;
      const courseProgress = totalCourses
        ? Math.round((completedCourses / totalCourses) * 100)
        : 0;
      const skillProgress = clamp(Math.round(score), 0, 100);
      const branchProgress = clamp(
        Math.round(skillProgress * 0.68 + courseProgress * 0.32),
        0,
        100,
      );

      return {
        skill_id: row.skill_id,
        name: row.skills?.name || "Skill",
        score,
        assessed: Object.prototype.hasOwnProperty.call(scores, row.skill_id),
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

    rows.sort(
      (a, b) => b.priority - a.priority || a.name.localeCompare(b.name),
    );
    return rows;
  }, [assessments, courses, deps, roleSkills, scores]);

  useEffect(() => {
    if (!computed.length) {
      setSelectedSkillId(null);
      setExpanded(null);
      return;
    }

    setSelectedSkillId((current) => {
      if (current && computed.some((skill) => skill.skill_id === current))
        return current;
      return computed[0].skill_id;
    });

    setExpanded((current) => {
      if (!current) return current;
      return computed.some((skill) => skill.skill_id === current)
        ? current
        : null;
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

      const { error } = await supabase
        .from("profiles")
        .update({ roadmap_view_mode: nextMode })
        .eq("id", user.id);
      if (error) throw error;
    } catch (err: any) {
      setViewMode(previousMode);
      toast(
        "Layout save failed",
        err.message || "Could not save roadmap layout.",
      );
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

      toast(
        "Courses generated",
        data.message || `${data.saved} resources saved.`,
      );
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
    } catch (error) {
      toast("Could not refresh priorities", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function startCourseAssessment(
    course: RoadmapCourse,
    skillName: string,
    skillId: string,
  ) {
    await startAssessment({ type: "course", course, skillName, skillId }, { purpose: "course", course_id: course.id });
  }

  async function startSkillAssessment(skillName: string, skillId: string) {
    await startAssessment({ type: "skill", skillName, skillId }, { purpose: "skill", skill_id: skillId });
  }

  async function startAssessment(target: NonNullable<AssessmentTarget>, payload: Record<string, string>) {
    assessmentRequest.current?.abort();
    const controller = new AbortController();
    assessmentRequest.current = controller;
    const version = ++assessmentVersion.current;
    setAssessLoading(true);
    setAssessTarget(target);
    setAssessResult(null);
    setAssessAnswers({});
    setAssessIndex(0);
    setAssessToken("");
    setAssessQuestions([]);

    try {
      const res = await fetch("/api/roadmap/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok || !data.questions?.length || !data.assessment_token)
        throw new Error(data.error || "No questions were available. Please try again.");
      if (version !== assessmentVersion.current) return;
      setAssessQuestions(data.questions);
      setAssessToken(data.assessment_token);
    } catch (error) {
      if (controller.signal.aborted || version !== assessmentVersion.current) return;
      toast("Assessment generation failed", error instanceof Error ? error.message : "Please try again.");
      setAssessTarget(null);
    } finally {
      if (version === assessmentVersion.current) {
        assessmentRequest.current = null;
        setAssessLoading(false);
      }
    }
  }

  async function submitAssessment() {
    if (!assessTarget || assessLoading || !assessToken) return;
    const version = assessmentVersion.current;
    setAssessLoading(true);
    try {
      const res = await fetch("/api/roadmap/submit-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: assessTarget.type,
          assessment_token: assessToken,
          answers: assessQuestions.map((question) => ({
            question_id: question.id,
            selected_index: assessAnswers[question.id] ?? -1,
          })),
        }),
      });
      const data = await res.json();
      if (version !== assessmentVersion.current) {
        void load();
        return;
      }
      if (!res.ok)
        return toast("Assessment failed", data.error || "Please try again.");
      setAssessQuestions((current) =>
        current.map((q) => ({
          ...q,
          ...data.review?.find((r: any) => r.id === q.id),
        })),
      );
      setScores((current) => {
        const next = { ...current };
        (data.skillScores || []).forEach((s: any) => {
          next[s.skill_id] = s.score;
        });
        return next;
      });
      if (
        assessTarget.type === "course" &&
        data.passed &&
        assessTarget.course
      ) {
        setCourses((current) =>
          current.map((course) =>
            course.id === assessTarget.course?.id
              ? { ...course, completed: true }
              : course,
          ),
        );
      }
      setAssessResult({
        score: data.score,
        correct: data.correct,
        total: data.total,
        passed: data.passed,
      });
    } catch (error: any) {
      if (version === assessmentVersion.current) toast("Assessment failed", error.message || "Please try again.");
    } finally {
      if (version === assessmentVersion.current) setAssessLoading(false);
    }
  }

  function closeAssessment() {
    ++assessmentVersion.current;
    assessmentRequest.current?.abort();
    assessmentRequest.current = null;
    setAssessLoading(false);
    setAssessTarget(null);
    setAssessToken("");
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
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <header className="atlas-page-header">
        <div>
          <p className="eyebrow">Living atlas</p>
          <h1 className="atlas-page-title">A map of what comes next.</h1>
          <p className="atlas-page-target">Target: <strong>{role?.name || "Choose a learning track"}</strong>{role && <a href="/profile" title="Change your learning track in your profile" aria-label="Change target role in your profile"><ChevronDown size={16} /></a>}</p>
        </div>
        {role && <div className="atlas-page-actions">
          <div className="atlas-view-switch" aria-label="Roadmap view">
            <button aria-pressed={viewMode === "tree"} onClick={() => void persistViewMode("tree")}><MapIcon size={18} />Map</button>
            <button aria-pressed={viewMode === "list"} onClick={() => void persistViewMode("list")}><LayoutList size={18} />List</button>
          </div>
          <div className="atlas-page-utilities">
            <button onClick={generateCourses} disabled={generatingCourses || loading}><Sparkles size={15} />{generatingCourses ? "Finding resources…" : "Find resources"}</button>
            <button onClick={generate} disabled={loading} aria-label="Refresh learning priorities" title="Refresh priorities"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /></button>
          </div>
          {savingViewMode && <span className="text-xs text-muted" role="status">Saving view…</span>}
        </div>}
      </header>
      {loadError && <div className="atlas-load-error" role="alert"><div><strong>Your map couldn’t load completely.</strong><p>{loadError}</p></div><button onClick={() => void load()} disabled={loading}>Try again</button></div>}
      {loading && computed.length === 0 && <div className="atlas-loading" role="status"><Loader2 className="animate-spin" size={25} /><span>Finding your place on the map…</span></div>}

      {!role && (
        <div className="rounded-2xl border border-line bg-paper-soft p-6 text-muted">
          Go to onboarding and pick a target role to unlock the roadmap.
        </div>
      )}

      {role && computed.length > 0 && viewMode === "tree" && (
        <LearningAtlas
          roleName={role?.name || "Target Role"}
          onGenerateResources={generateCourses}
          generatingResources={generatingCourses}
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

      {role && computed.length === 0 && !loading && !loadError && (
        <div className="rounded-2xl border border-line bg-paper-soft p-6 text-muted">
          This track does not have any skills yet. Choose a supported learning track in your profile to start your map.
        </div>
      )}

      <AnimatePresence>
        {assessTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === event.currentTarget) closeAssessment();
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface p-6 md:p-8"
            >
              <FocusDialog label={assessTitle} onClose={closeAssessment}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow mb-3">Check your understanding</p>
                    <h3 className="text-xl font-semibold">{assessTitle}</h3>
                  </div>
                  <button
                    onClick={closeAssessment}
                    aria-label="Close assessment"
                    className="p-2 text-muted rounded-lg hover:bg-paper"
                  >
                    <XCircle size={20} />
                  </button>
                </div>

                {assessLoading && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-muted">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating assessment...
                  </div>
                )}

                {!assessLoading && !assessResult && activeQuestion && (
                  <div className="mt-6 space-y-5">
                    <div className="flex items-center justify-between gap-4 text-sm text-muted">
                      <span>
                        Question {assessIndex + 1} of {assessQuestions.length}
                      </span>
                      <span>
                        Pass mark:{" "}
                        {assessTarget?.type === "course"
                          ? COURSE_PASS_THRESHOLD
                          : SKILL_PASS_THRESHOLD}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (assessIndex / Math.max(assessQuestions.length, 1)) *
                        100
                      }
                    />
                    <div className="text-lg font-medium">
                      {activeQuestion.prompt}
                    </div>
                    <QuestionOptions
                      options={activeQuestion.options || []}
                      value={assessAnswers[activeQuestion.id]}
                      onChange={(index) =>
                        setAssessAnswers((current) => ({
                          ...current,
                          [activeQuestion.id]: index,
                        }))
                      }
                      disabled={assessLoading}
                    />

                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="ghost"
                        disabled={assessIndex === 0}
                        onClick={() =>
                          setAssessIndex((i) => Math.max(0, i - 1))
                        }
                      >
                        Previous
                      </Button>
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
                        {assessIndex + 1 < assessQuestions.length
                          ? "Next"
                          : "Submit"}
                      </Button>
                    </div>
                  </div>
                )}

                {assessResult && (
                  <div className="mt-6 space-y-5 text-center">
                    <div
                      className={cn(
                        "text-6xl font-bold",
                        assessResult.passed ? "text-forest" : "text-rust",
                      )}
                    >
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
                              isCorrect
                                ? "border-emerald-500/20 bg-emerald-500/5"
                                : "border-rose-500/20 bg-rose-500/5",
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {isCorrect ? (
                                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                              ) : (
                                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rust" />
                              )}
                              <div>
                                <div className="font-medium">
                                  {question.prompt}
                                </div>
                                {!isCorrect && (
                                  <div className="mt-1 text-xs text-muted">
                                    Correct answer:{" "}
                                    {question.options[question.correct_index]}
                                  </div>
                                )}
                                {question.explanation && (
                                  <div className="mt-1 text-xs text-muted">
                                    {question.explanation}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Button onClick={closeAssessment}>Close</Button>
                  </div>
                )}
              </FocusDialog>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RoadmapClassicView(_: {
  skills: SkillNode[];
  expanded: string | null;
  latestAssessmentByCourse: Map<string, CourseAssessment>;
  onToggle: (skillId: string) => void;
  onOpenSkillAssessment: (skillName: string, skillId: string) => void;
  onOpenCourseAssessment: (
    course: RoadmapCourse,
    skillName: string,
    skillId: string,
  ) => void;
}) {
  const {
    skills,
    expanded,
    latestAssessmentByCourse,
    onToggle,
    onOpenSkillAssessment,
    onOpenCourseAssessment,
  } = _;

  return (
    <div className="space-y-3">
      {skills.map((skill) => {
        const isExpanded = expanded === skill.skill_id;

        return (
          <Card key={skill.skill_id} className="overflow-hidden bg-paper-soft">
            <button
              onClick={() => onToggle(skill.skill_id)}
              className="w-full p-5 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold">{skill.name}</div>
                    <Badge tone={skill.assessed ? categoryTone(skill.category) : "neutral"}>
                      {skill.assessed ? skill.category : "Not assessed"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted">
                    <span>{skill.assessed ? `Skill score: ${skill.score}%` : "Skill not assessed"}</span>
                    <span>Priority: {skill.priority}</span>
                    <span>
                      Resources: {skill.completedCourses}/{skill.totalCourses || 0}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Progress value={skill.branchProgress} />
                    <div className="mt-1 text-xs text-muted">
                      Branch {skill.branchProgress}% - Skill{" "}
                      {skill.skillProgress}% - Resources {skill.courseProgress}%
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted" />
                )}
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
                  <CardContent className="border-t border-line px-5 pb-5 pt-0">
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
  onOpenCourseAssessment: (
    course: RoadmapCourse,
    skillName: string,
    skillId: string,
  ) => void;
}) {
  const {
    skill,
    latestAssessmentByCourse,
    onOpenSkillAssessment,
    onOpenCourseAssessment,
  } = _;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[0.95fr,1.05fr]">
        <div className="rounded-3xl border border-line bg-paper-soft p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">
            Branch health
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-line bg-surface p-3">
              <div className="text-lg font-semibold text-ink">
                {skill.assessed ? `${skill.skillProgress}%` : "Not assessed"}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">
                Skill score
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-3">
              <div className="text-lg font-semibold text-ink">
                {skill.completedCourses}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">
                Resources done
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-3">
              <div className="text-lg font-semibold text-ink">
                {skill.priority}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">
                Priority
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={skill.branchProgress} />
          </div>
          <div className="mt-2 text-sm text-muted">
            Branch progress blends test mastery and completed resources so the
            tree stays responsive to both.
          </div>
        </div>

        <button
          onClick={() => onOpenSkillAssessment(skill.name, skill.skill_id)}
          className="flex w-full items-center justify-center gap-3 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sky transition hover:bg-indigo-500/10"
        >
          <ClipboardCheck className="h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">Take Skill Assessment</div>
            <div className="text-sm text-sky">
              Push this branch forward with a focused skill test for{" "}
              {skill.name}. Passing is {SKILL_PASS_THRESHOLD}%.
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
                  completed
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-line bg-paper-soft",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "rounded-2xl p-2",
                      completed
                        ? "bg-emerald-500/20 text-forest"
                        : "bg-paper-soft text-muted",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium">{course.title}</div>
                      {completed && (
                        <CheckCircle className="h-4 w-4 shrink-0 text-forest" />
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {course.provider || "Unknown provider"}
                      {course.estimated_hours
                        ? ` - ~${course.estimated_hours}h`
                        : ""}
                    </div>
                    {course.description && (
                      <div className="mt-1 text-xs text-muted">
                        {course.description}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          difficultyBadge(course.difficulty),
                        )}
                      >
                        {course.difficulty || "intermediate"}
                      </span>
                      <span className="rounded-full bg-paper-soft px-2 py-0.5 text-xs text-muted">
                        {course.type}
                      </span>
                      {lastAssessment && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs",
                            lastAssessment.passed
                              ? "bg-emerald-500/10 text-forest"
                              : "bg-rose-500/10 text-rust",
                          )}
                        >
                          Last: {lastAssessment.score}%{" "}
                          {lastAssessment.passed ? "Passed" : "Retry"}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {course.url && (
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper-soft px-3 py-2 text-xs text-ink transition hover:bg-paper-soft"
                          title="Open resource"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open resource
                        </a>
                      )}
                      {!completed && (
                        <button
                          onClick={() =>
                            onOpenCourseAssessment(
                              course,
                              skill.name,
                              skill.skill_id,
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-forest transition hover:bg-emerald-500/20"
                          title="Mark complete with AI test"
                        >
                          <GraduationCap className="h-3.5 w-3.5" />
                          Mark complete
                        </button>
                      )}
                    </div>
                    {!completed && (
                      <div className="mt-2 text-xs text-muted">
                        Mark complete runs an assessment on this course. The
                        leaf is only completed after scoring{" "}
                        {COURSE_PASS_THRESHOLD}% or higher.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-paper-soft px-4 py-8 text-center text-sm text-muted">
          No resources yet. Use <strong>Find learning resources</strong> above
          to generate the leaves for this branch.
        </div>
      )}
    </div>
  );
}
