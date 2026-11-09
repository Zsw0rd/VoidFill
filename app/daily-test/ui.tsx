"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Target,
  Clock3,
  BookOpen,
  Brain,
  ChevronRight,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";

import { QuestionOptions } from "@/components/QuestionOptions";
import { useAssessmentDraft } from "@/components/useAssessmentDraft";
import { AssessmentDraftNotice } from "@/components/AssessmentDraftNotice";
import { useQuestionNavigation } from "@/components/useQuestionNavigation";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  correct_index?: number;
  difficulty: number;
  skill_name: string;
  explanation?: string;
};

export function DailyTestClient({ ownerId, contextKey, existingAttempt, coverage }: { ownerId: string; contextKey: string; existingAttempt: any; coverage: {covered: number; total: number} }) {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"start" | "quiz" | "review" | "done">(
    "start",
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessmentToken, setAssessmentToken] = useState("");
  const [index, setIndex] = useState(0);
  const { questionHeading, moveQuestion } = useQuestionNavigation(index, setIndex);
  const startHeading = useRef<HTMLHeadingElement>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [submissionError, setSubmissionError] = useState<{message: string; restart: boolean} | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [difficultyLabel, setDifficultyLabel] = useState("Easy");
  const draft = useAssessmentDraft({ ownerId, contextKey, slot: "daily", disabled: !!existingAttempt?.completed_at,
    onRestore: (session, saved) => {
      setQuestions(session.questions); setAssessmentToken(saved.token); setAnswers(saved.answers);
      setIndex(saved.index); setDifficulty(session.difficulty);
      setDifficultyLabel(["", "Easy", "Moderate", "Intermediate", "Hard", "Expert"][session.difficulty] || "Easy");
      setStage("quiz"); setSubmissionError(null);
    },
  });
  const { persist: persistDraft, expiresAt } = draft;
  useEffect(() => {
    if (stage === "quiz" && assessmentToken && expiresAt) persistDraft({ purpose: "daily", token: assessmentToken, expiresAt, index, answers });
  }, [stage, assessmentToken, expiresAt, index, answers, persistDraft]);

  function discardDraft() {
    draft.discard(); setStage("start"); setQuestions([]); setAssessmentToken(""); setAnswers({});
    setIndex(0); setResult(null); setSubmissionError(null);
  }

  function discardAssessment() {
    discardDraft();
    requestAnimationFrame(() => startHeading.current?.focus());
  }

  const total = questions.length || 10;
  const progress =
    stage === "quiz"
      ? (index / total) * 100
      : stage === "done" || stage === "review"
        ? 100
        : 0;

  const diffBadgeTone =
    difficulty <= 2 ? "good" : difficulty <= 3 ? "warn" : "bad";
  const completedAttempt = result?.alreadyCompleted ? result : existingAttempt;

  // Check if already completed
  if ((completedAttempt?.completed_at && stage === "start") || result?.alreadyCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-forest mx-auto" />
            <h1 className="mt-4 page-title">You showed up. That counts.</h1>
            <p className="mt-2 text-sm text-muted">
              Today’s saved assessment: {completedAttempt.correct_count}/
              {completedAttempt.total_count} • XP earned:{" "}
              {completedAttempt.xp_earned}
            </p>
            {result?.alreadyCompleted && <p className="mt-4 text-sm text-muted" role="status">Today’s assessment was already saved in another tab or session. This submission did not award additional XP or change your scores.</p>}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/roadmap"
                className="rounded-2xl bg-emerald-500/90 hover:bg-emerald-500 px-5 py-3 font-medium text-ink shadow-soft text-center"
              >
                View roadmap
              </Link>
              <Link
                href="/dashboard"
                className="rounded-2xl bg-paper-soft hover:bg-paper-soft border border-line px-5 py-3 font-medium text-center"
              >
                Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  async function start() {
    if (!draft.ready || loading) return;
    discardDraft();
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-questions", { method: "POST" });
      const data = await res.json();
      if (!res.ok)
        return toast(
          "Could not load questions",
          data.error || "Please try again.",
        );
      if (!data.questions?.length || !data.assessment_token)
        return toast("No questions available", "Please try again.");
      setSubmissionError(null);
      setQuestions(data.questions);
      setAssessmentToken(data.assessment_token);
      draft.setExpiresAt(data.expires_at);
      setDifficulty(data.difficulty || 1);
      setDifficultyLabel(data.difficultyLabel || "Easy");
      setStage("quiz");
      setIndex(0);
      setAnswers({});
    } catch (error: any) {
      toast("Could not load questions", error.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const q = questions[index];

  function pick(optIdx: number) {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.id]: optIdx }));
  }

  function next() {
    if (!q) return;
    if (answers[q.id] === undefined)
      return toast("Pick an option", "Choose one answer to continue.");
    if (index + 1 < questions.length) moveQuestion(index + 1);
    else submit();
  }

  async function submit() {
    setSubmissionError(null);
    setLoading(true);
    try {
      const payload = {
        assessment_token: assessmentToken,
        answers: questions.map((q) => ({
          question_id: q.id,
          selected_index: answers[q.id] ?? -1,
        })),
      };
      const res = await fetch("/api/daily-test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = data.error || "Your result could not be confirmed. Please retry saving.";
        setSubmissionError({message, restart: res.status === 400 && /assessment.*(?:invalid|expired)/i.test(message)});
        return;
      }
      if (data.alreadyCompleted) {
        draft.discard();
        setResult(data); setQuestions([]); setAnswers({}); setAssessmentToken(""); setStage("done");
        toast("Already completed", "Your first saved assessment remains unchanged.");
        return;
      }
      setQuestions((current) =>
        current.map((q) => ({
          ...q,
          ...data.review?.find((r: any) => r.id === q.id),
        })),
      );
      setResult(data);
      draft.discard();
      setStage("review");
      toast("Done!", `+${data?.xp_earned || 0} XP earned`);
    } catch (error: any) {
      setSubmissionError({message: error.message || "Your result could not be confirmed. Please retry saving.", restart: false});
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card>
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow mb-3">02 / A daily check-in</p>
              <h1 ref={startHeading} tabIndex={-1} className="page-title">A little practice goes a long way.</h1>
              <p className="mt-1 text-sm text-muted">
                A focused assessment, shaped around your skills and your next
                step.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stage !== "start" && (
                <Badge tone={diffBadgeTone as any}>
                  {difficultyLabel} (Lvl {difficulty})
                </Badge>
              )}
              <Link
                href="/dashboard"
                className="text-sm text-muted hover:text-ink"
              >
                Back
              </Link>
            </div>
          </div>
          {stage !== "start" && (
            <div className="mt-5">
              <Progress value={progress} />
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6">
          {(stage === "start" || stage === "quiz") && <AssessmentDraftNotice message={draft.message} storageAvailable={draft.storageAvailable} retry={draft.retry} expired={draft.expired} onRetry={draft.retryRestore} onDiscard={discardAssessment} />}
          {stage === "start" && (
            <div className="assessment-start">
              <span className="icon-tile !bg-surface mb-5">
                <ClipboardCheckIcon />
              </span>
              <h2 className="!text-2xl font-semibold">
                A clearer picture of where you are.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
                One assessment each day. Questions focus on your target role and
                adapt to your recent performance, so every check-in has a
                purpose.
              </p>
              <div className="mt-7 grid sm:grid-cols-3 gap-5 border-y border-forest/15 py-5">
                {[
                  {
                    Icon: Target,
                    title: "Focused on you",
                    text: "Practice the skills that need attention.",
                  },
                  {
                    Icon: Clock3,
                    title: "At your own pace",
                    text: "No countdown. Open checks expire after two hours.",
                  },
                  {
                    Icon: BookOpen,
                    title: "Learn from each answer",
                    text: "Review explanations after you finish.",
                  },
                ].map(({ Icon, title, text }) => (
                  <div key={title}>
                    <Icon size={17} className="text-forest mb-3" />
                    <h3 className="text-xs font-semibold">{title}</h3>
                    <p className="mt-2 text-[11px] leading-5 text-muted">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-6 text-muted">Knowledge checks cover {coverage.covered} of your {coverage.total} learning areas. Specialist skills use <Link href="/careers" className="underline text-forest">practical career activities</Link>. Scores describe knowledge, not workplace competence.</p>
              <Button disabled={coverage.covered === 0 || !draft.ready} loading={loading} onClick={start} className="mt-7">
                {loading ? (
                  "Preparing your questions…"
                ) : (
                  <>
                    Begin today’s assessment
                    <ArrowRight size={15} />
                  </>
                )}
              </Button>
              <p className="mt-3 text-[10px] text-muted">
                Complete the assessment to update your skill scores and earn XP.
              </p>
            </div>
          )}

          {stage === "quiz" && q && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted">
                  Question {index + 1} of {questions.length}
                </div>
                <Badge tone="neutral">{q.skill_name}</Badge>
              </div>
              <div ref={questionHeading} role="heading" aria-level={2} tabIndex={-1} className="text-xl font-semibold leading-snug" aria-live="polite" aria-atomic="true">
                {q.prompt}
              </div>

              <QuestionOptions
                question={q.prompt}
                options={q.options || []}
                value={answers[q.id]}
                onChange={pick}
                disabled={loading || draft.expired}
              />

              {submissionError && <div role="alert" className="rounded-xl border border-rust/30 bg-peach p-4 text-sm text-ink">
                <p className="font-semibold">Your result has not been confirmed</p>
                <p className="mt-2">{submissionError.message}</p>
                {submissionError.restart
                  ? <Button className="mt-3" variant="soft" onClick={start} loading={loading}>Start a new assessment</Button>
                  : <p className="mt-2">Your answers remain in this tab. Use Finish assessment to retry the same submission safely.</p>}
              </div>}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="ghost" disabled={loading} onClick={discardAssessment}>Discard assessment</Button>
                <Button
                  variant="ghost"
                  disabled={index === 0 || loading}
                  onClick={() => moveQuestion(Math.max(0, index - 1))}
                >
                  <ArrowLeft size={14} />
                  Previous
                </Button>
                <Button
                  disabled={loading || draft.expired || answers[q.id] === undefined}
                  loading={loading}
                  onClick={next}
                >
                  {index + 1 < questions.length ? (
                    <>
                      Next <ChevronRight className="w-4 h-4" />
                    </>
                  ) : loading ? (
                    "Saving your answers…"
                  ) : (
                    "Finish assessment"
                  )}
                </Button>
              </div>
            </div>
          )}

          {stage === "review" && (
            <div className="space-y-6">
              {/* Score Summary */}
              <div className="rounded-2xl border border-line bg-gradient-to-br from-emerald-500/5 to-paper p-6 text-center">
                <div className="text-4xl font-bold">
                  {result?.correct_count ?? 0}/{result?.total_count ?? 10}
                </div>
                <div className="mt-1 text-sm text-muted">
                  Correct answers • +{result?.xp_earned ?? 0} XP earned
                </div>
                <div className="mt-3">
                  <Badge tone={diffBadgeTone as any}>
                    Difficulty: {difficultyLabel}
                  </Badge>
                </div>
              </div>

              {/* Per-question review */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Question Review</h3>
                {questions.map((question, qi) => {
                  const userAnswer = answers[question.id];
                  const isCorrect = userAnswer === question.correct_index;
                  return (
                    <div
                      key={qi}
                      className={`rounded-2xl border p-4 ${isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}
                    >
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-forest shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rust shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {question.prompt}
                          </div>
                          <div className="mt-2 text-xs text-muted">
                            Your answer:{" "}
                            <span
                              className={
                                isCorrect ? "text-forest" : "text-rust"
                              }
                            >
                              {question.options[userAnswer]}
                            </span>
                            {!isCorrect &&
                              question.correct_index !== undefined && (
                                <>
                                  {" "}
                                  • Correct:{" "}
                                  <span className="text-forest">
                                    {question.options[question.correct_index]}
                                  </span>
                                </>
                              )}
                          </div>
                          {question.explanation && (
                            <div className="mt-2 text-xs text-muted bg-paper-soft rounded-xl p-3">
                              {question.explanation}
                            </div>
                          )}
                        </div>
                        <Badge tone="neutral">{question.skill_name}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/roadmap"
                  className="rounded-2xl bg-emerald-500/90 hover:bg-emerald-500 px-5 py-3 font-medium text-ink shadow-soft text-center flex-1"
                >
                  View updated roadmap
                </Link>
                <Link
                  href="/skill-graph"
                  className="rounded-2xl bg-paper-soft hover:bg-paper-soft border border-line px-5 py-3 font-medium text-center flex-1"
                >
                  See skill graph
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-2xl bg-paper-soft hover:bg-paper-soft border border-line px-5 py-3 font-medium text-center flex-1"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ClipboardCheckIcon() {
  return <Brain size={22} strokeWidth={1.5} />;
}
