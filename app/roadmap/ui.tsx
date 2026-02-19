"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { categoryFromScore, priorityScore } from "@/lib/gapLogic";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ExternalLink, BookOpen, Code, GraduationCap, Play, CheckCircle, XCircle, Sparkles, Loader2, ClipboardCheck } from "lucide-react";

const typeIcons: Record<string, any> = {
  course: GraduationCap,
  book: BookOpen,
  project: Code,
  tutorial: Play,
  practice: Code,
};

export function RoadmapClient({ role }: { role: any }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [roleSkills, setRoleSkills] = useState<any[]>([]);
  const [deps, setDeps] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [courses, setCourses] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [generatingCourses, setGeneratingCourses] = useState(false);

  // Assessment modal state
  const [assessTarget, setAssessTarget] = useState<{ type: "course" | "skill"; course?: any; skillName: string; skillId: string } | null>(null);
  const [assessQuestions, setAssessQuestions] = useState<any[]>([]);
  const [assessIndex, setAssessIndex] = useState(0);
  const [assessAnswers, setAssessAnswers] = useState<Record<string, number>>({});
  const [assessLoading, setAssessLoading] = useState(false);
  const [assessResult, setAssessResult] = useState<any>(null);

  const roleId = role?.id;

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return toast("Not logged in"); }
    if (!roleId) { setLoading(false); return; }

    const [rs, d, us, cr, ca] = await Promise.all([
      supabase.from("role_skills").select("skill_id, weight, skills(name)").eq("role_id", roleId),
      supabase.from("skill_dependencies").select("prerequisite_skill_id, dependent_skill_id"),
      supabase.from("user_skill_scores").select("skill_id, score").eq("user_id", user.id),
      supabase.from("roadmap_courses").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("course_assessments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (rs.error) return toast("Load failed", rs.error.message);
    setRoleSkills(rs.data || []);
    setDeps(d.data || []);
    const m: Record<string, number> = {};
    (us.data || []).forEach((r: any) => (m[r.skill_id] = r.score));
    setScores(m);
    setCourses(cr.data || []);
    setAssessments(ca.data || []);
    setLoading(false);
  }, [supabase, roleId]);

  useEffect(() => { load(); }, [load]);

  const computed = useMemo(() => {
    if (!roleSkills.length) return [];
    const dependsOn = new Map<string, Set<string>>();
    deps.forEach((x: any) => {
      const set = dependsOn.get(x.prerequisite_skill_id) || new Set<string>();
      set.add(x.dependent_skill_id);
      dependsOn.set(x.prerequisite_skill_id, set);
    });
    const roleSkillIds = new Set(roleSkills.map((r: any) => r.skill_id));

    const rows = roleSkills.map((r: any) => {
      const score = Number(scores[r.skill_id] ?? 0);
      const cat = categoryFromScore(score);
      const depSet = dependsOn.get(r.skill_id);
      let bonus = 1;
      if (depSet) { for (const dep of depSet) { if (roleSkillIds.has(dep)) { bonus = 2; break; } } }
      const p = priorityScore({ score, roleWeight: Number(r.weight ?? 0.8), dependencyBonus: bonus });

      const skillCourses = courses.filter((c: any) => c.skill_id === r.skill_id);
      const skillAssessments = assessments.filter((a: any) => skillCourses.some((c: any) => c.id === a.course_id));
      const completedCourses = skillCourses.filter((c: any) => c.completed).length;
      const courseProgress = skillCourses.length > 0 ? Math.round((completedCourses / skillCourses.length) * 100) : 0;

      return {
        skill_id: r.skill_id,
        name: r.skills?.name || "Skill",
        score, category: cat,
        role_weight: Number(r.weight ?? 0.8),
        dependency_bonus: bonus,
        priority: p,
        courses: skillCourses,
        assessments: skillAssessments,
        courseProgress,
      };
    });
    rows.sort((a, b) => b.priority - a.priority);
    return rows;
  }, [roleSkills, deps, scores, courses, assessments]);

  const overallProgress = computed.length > 0 ? Math.round(computed.reduce((s, x) => s + x.courseProgress, 0) / computed.length) : 0;

  async function generateCourses() {
    setGeneratingCourses(true);
    try {
      const res = await fetch("/api/ai/recommend-courses", { method: "POST" });
      const data = await res.json();
      setGeneratingCourses(false);
      if (!res.ok) {
        return toast("Generate failed", data.error || data.detail || "Unknown error");
      }
      toast("Courses generated!", data.message || `${data.saved} resources saved.`);
      if (data.unmatched?.length) {
        console.warn("Unmatched skills:", data.unmatched);
      }
      load();
    } catch (err: any) {
      setGeneratingCourses(false);
      toast("Network error", err.message);
    }
  }

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/roadmap/generate", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Unknown error" }));
      return toast("Generate failed", data.error || "Unknown error");
    }
    toast("Roadmap saved", "Priorities updated.");
    load();
  }

  // ── Assessment functions ──

  async function startCourseAssessment(course: any, skillName: string, skillId: string) {
    setAssessLoading(true);
    setAssessTarget({ type: "course", course, skillName, skillId });
    setAssessResult(null);
    setAssessAnswers({});
    setAssessIndex(0);

    const res = await fetch("/api/roadmap/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: course.id, course_title: course.title, skill_name: skillName }),
    });
    setAssessLoading(false);
    if (!res.ok) return toast("Assessment generation failed");
    const data = await res.json();
    setAssessQuestions(data.questions || []);
  }

  async function startSkillAssessment(skillName: string, skillId: string) {
    setAssessLoading(true);
    const skillCourses = courses.filter((c: any) => c.skill_id === skillId);
    const courseTitles = skillCourses.map((c: any) => c.title).join(", ");

    setAssessTarget({ type: "skill", skillName, skillId });
    setAssessResult(null);
    setAssessAnswers({});
    setAssessIndex(0);

    const res = await fetch("/api/roadmap/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skill_name: skillName,
        course_title: `Skill assessment for ${skillName}${courseTitles ? ` covering: ${courseTitles}` : ""}`,
        is_skill_assessment: true,
      }),
    });
    setAssessLoading(false);
    if (!res.ok) return toast("Assessment generation failed");
    const data = await res.json();
    setAssessQuestions(data.questions || []);
  }

  async function submitAssessment() {
    if (!assessTarget) return;
    const total = assessQuestions.length;
    let correct = 0;
    assessQuestions.forEach((q) => {
      if (assessAnswers[q.id] === q.correct_index) correct++;
    });
    const assessScore = Math.round((correct / total) * 100);
    const passed = assessScore >= 60;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (assessTarget.type === "course" && assessTarget.course) {
      // Save course assessment result
      await supabase.from("course_assessments").insert({
        user_id: user.id,
        course_id: assessTarget.course.id,
        score: assessScore, total, passed,
        answers: assessAnswers,
      });

      // If passed, mark course as completed
      if (passed) {
        await supabase.from("roadmap_courses").update({ completed: true }).eq("id", assessTarget.course.id);
      }
    }

    // Update user_skill_scores based on assessment performance
    const skillId = assessTarget.skillId;
    if (skillId) {
      const prevScore = scores[skillId] ?? 0;
      // Weighted average: 70% existing + 30% assessment
      const newScore = Math.round(prevScore * 0.7 + assessScore * 0.3);
      await supabase.from("user_skill_scores").upsert({
        user_id: user.id,
        skill_id: skillId,
        score: newScore,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,skill_id" });

      // Update roadmap progress for this skill
      const skillCourses = courses.filter((c: any) => c.skill_id === skillId);
      const completedCount = skillCourses.filter((c: any) => c.completed || (assessTarget.type === "course" && passed && c.id === assessTarget.course?.id)).length;
      const progress = skillCourses.length > 0 ? Math.round((completedCount / skillCourses.length) * 100) : assessScore;

      await supabase.from("user_roadmap").update({ progress }).eq("user_id", user.id).eq("skill_id", skillId);

      // ── Immediately update local state so UI re-renders ──
      setScores(prev => ({ ...prev, [skillId]: newScore }));

      if (assessTarget.type === "course" && passed && assessTarget.course) {
        setCourses(prev => prev.map(c => c.id === assessTarget.course!.id ? { ...c, completed: true } : c));
      }
    }

    setAssessResult({ score: assessScore, correct, total, passed });
  }

  function closeAssessment() {
    setAssessTarget(null);
    setAssessQuestions([]);
    setAssessResult(null);
    load();
  }

  const aq = assessQuestions[assessIndex];
  const assessTitle = assessTarget?.type === "course"
    ? `Assessment: ${assessTarget.course?.title}`
    : `Skill Assessment: ${assessTarget?.skillName}`;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Roadmap</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {role ? `Target: ${role.name}` : "Select a target role to generate roadmap."}
          </p>
        </div>
        {role && (
          <div className="flex gap-2">
            <Button variant="soft" disabled={generatingCourses} onClick={generateCourses}>
              {generatingCourses ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> AI Recommendations</>}
            </Button>
            <Button disabled={loading} onClick={generate}>
              {loading ? "Working..." : "Refresh priorities"}
            </Button>
          </div>
        )}
      </div>

      {/* Overall Progress */}
      {role && computed.length > 0 && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/5 to-zinc-900/50 p-5">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Overall Progress</div>
            <div className="text-sm text-zinc-400">{overallProgress}%</div>
          </div>
          <Progress value={overallProgress} />
          <div className="mt-2 text-xs text-zinc-500">{computed.filter(x => x.courseProgress === 100).length}/{computed.length} skills completed</div>
        </div>
      )}

      {!role && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-zinc-300">
          Go to onboarding and pick a target role to unlock the roadmap.
        </div>
      )}

      {/* Skill Cards */}
      {role && computed.length > 0 && (
        <div className="mt-6 space-y-3">
          {computed.map((x) => {
            const isExpanded = expanded === x.skill_id;
            const tone = x.category === "Strong" ? "good" : x.category === "Moderate" ? "warn" : "bad";

            return (
              <Card key={x.skill_id} className="bg-white/5 overflow-hidden">
                {/* Skill header — clickable */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : x.skill_id)}
                  className="w-full text-left p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-semibold">{x.name}</div>
                        <Badge tone={tone as any}>{x.category}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-zinc-400">
                        <span>Score: {x.score}%</span>
                        <span>Priority: {x.priority}</span>
                        <span>{x.courses.length} resources</span>
                      </div>
                      <div className="mt-2">
                        <Progress value={x.courseProgress} />
                        <div className="mt-1 text-xs text-zinc-500">{x.courseProgress}% completed</div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <CardContent className="px-5 pb-5 pt-0 border-t border-white/5">
                        {/* Skill-level assessment button */}
                        <div className="mt-4 mb-3">
                          <button
                            onClick={() => startSkillAssessment(x.name, x.skill_id)}
                            className="w-full rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 p-3 transition flex items-center justify-center gap-2 text-indigo-300"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            <span className="text-sm font-medium">Take Skill Assessment for {x.name}</span>
                          </button>
                        </div>

                        {x.courses.length > 0 ? (
                          <div className="space-y-3">
                            {x.courses.map((course: any, ci: number) => {
                              const Icon = typeIcons[course.type] || BookOpen;
                              const courseAssessments = x.assessments.filter((a: any) => a.course_id === course.id);
                              const lastAssessment = courseAssessments[0];
                              const diffBg = course.difficulty === "beginner" ? "bg-green-500/10 text-green-300" : course.difficulty === "advanced" ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-300";

                              return (
                                <div key={ci} className={`rounded-xl border p-4 ${course.completed ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}>
                                  <div className="flex items-start gap-3">
                                    <div className={`rounded-lg p-2 ${course.completed ? "bg-emerald-500/20" : "bg-white/5"}`}>
                                      <Icon className={`w-5 h-5 ${course.completed ? "text-emerald-300" : "text-zinc-400"}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <div className="font-medium truncate">{course.title}</div>
                                        {course.completed && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                                      </div>
                                      <div className="mt-1 text-xs text-zinc-400">{course.provider} {course.estimated_hours ? `• ~${course.estimated_hours}h` : ""}</div>
                                      {course.description && <div className="mt-1 text-xs text-zinc-500">{course.description}</div>}
                                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${diffBg}`}>{course.difficulty}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">{course.type}</span>
                                        {lastAssessment && (
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${lastAssessment.passed ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
                                            Last: {lastAssessment.score}% {lastAssessment.passed ? "Passed" : "Failed"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                      {course.url && (
                                        <a href={course.url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 p-2 transition">
                                          <ExternalLink className="w-4 h-4" />
                                        </a>
                                      )}
                                      {!course.completed && (
                                        <button onClick={() => startCourseAssessment(course, x.name, x.skill_id)} className="rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 p-2 transition text-emerald-300" title="Take course assessment">
                                          <GraduationCap className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-zinc-400 text-center py-4">
                            No resources yet. Click <strong>&quot;AI Recommendations&quot;</strong> to generate courses and books.
                          </div>
                        )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}

      {role && computed.length === 0 && !loading && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-zinc-300">
          No role skills or user scores yet. Take a daily test first.
        </div>
      )}

      {/* Assessment Modal */}
      <AnimatePresence>
        {assessTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeAssessment(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6"
            >
              <h3 className="text-xl font-semibold">{assessTitle}</h3>

              {assessLoading && (
                <div className="mt-6 flex items-center justify-center gap-2 text-zinc-400">
                  <Loader2 className="w-5 h-5 animate-spin" /> Generating assessment...
                </div>
              )}

              {!assessLoading && !assessResult && aq && (
                <div className="mt-6 space-y-5">
                  <div className="text-sm text-zinc-400">Question {assessIndex + 1} of {assessQuestions.length}</div>
                  <Progress value={((assessIndex) / assessQuestions.length) * 100} />
                  <div className="text-lg font-medium">{aq.prompt}</div>
                  <div className="grid gap-3">
                    {(aq.options || []).map((opt: string, i: number) => {
                      const active = assessAnswers[aq.id] === i;
                      return (
                        <button
                          key={i}
                          onClick={() => setAssessAnswers(a => ({ ...a, [aq.id]: i }))}
                          className={`text-left rounded-xl border p-3 transition ${active ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium ${active ? "border-emerald-400 text-emerald-300" : "border-white/20 text-zinc-400"}`}>
                              {String.fromCharCode(65 + i)}
                            </div>
                            <span className="text-sm">{opt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="soft" onClick={closeAssessment}>Cancel</Button>
                    <Button onClick={() => {
                      if (assessAnswers[aq.id] === undefined) return toast("Pick an answer");
                      if (assessIndex + 1 < assessQuestions.length) setAssessIndex(i => i + 1);
                      else submitAssessment();
                    }}>
                      {assessIndex + 1 < assessQuestions.length ? "Next" : "Submit"}
                    </Button>
                  </div>
                </div>
              )}

              {assessResult && (
                <div className="mt-6 space-y-5 text-center">
                  <div className={`text-6xl font-bold ${assessResult.passed ? "text-emerald-400" : "text-rose-400"}`}>
                    {assessResult.score}%
                  </div>
                  <div className="text-lg font-medium">{assessResult.correct}/{assessResult.total} correct</div>
                  <Badge tone={assessResult.passed ? "good" : "bad"}>
                    {assessResult.passed
                      ? (assessTarget?.type === "course" ? "Passed! Course completed." : "Passed! Skill score updated.")
                      : "Not passed. Try again after review."}
                  </Badge>

                  {/* Show explanations */}
                  <div className="space-y-3 text-left mt-4">
                    {assessQuestions.map((q, qi) => {
                      const userAns = assessAnswers[q.id];
                      const isCorrect = userAns === q.correct_index;
                      return (
                        <div key={qi} className={`rounded-xl border p-3 text-sm ${isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}>
                          <div className="flex items-start gap-2">
                            {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                            <div>
                              <div className="font-medium">{q.prompt}</div>
                              {!isCorrect && <div className="text-xs text-zinc-400 mt-1">Correct answer: {q.options[q.correct_index]}</div>}
                              {q.explanation && <div className="text-xs text-zinc-300 mt-1">{q.explanation}</div>}
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
