"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Dumbbell,
  CheckCircle,
  XCircle,
  TrendingUp,
  Sparkles,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

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

interface Props {
  ownerId: string;
  contextKey: string;
  recentAttempts: {
    score: number;
    difficulty_level: number;
    created_at: string;
  }[];
  skillNames: string[];
}

const DIFF_LABELS = ["", "Easy", "Moderate", "Intermediate", "Hard", "Expert"];
const DIFF_TONES: Record<number, string> = {
  1: "good",
  2: "good",
  3: "warn",
  4: "bad",
  5: "bad",
};

export function PracticeTestClient({ ownerId, contextKey, recentAttempts, skillNames }: Props) {
  const [stage, setStage] = useState<"start" | "quiz" | "review" | "done">(
    "start",
  );
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessmentToken, setAssessmentToken] = useState("");
  const [index, setIndex] = useState(0);
  const { questionHeading, moveQuestion } = useQuestionNavigation(index, setIndex);
  const startHeading = useRef<HTMLHeadingElement>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [submissionError, setSubmissionError] = useState<{message: string; restart: boolean} | null>(null);
  const [difficulty, setDifficulty] = useState(() =>
    computeAdaptiveDifficulty(recentAttempts),
  );
  const draft = useAssessmentDraft({ ownerId, contextKey, slot: "practice", onRestore: (session, saved) => {
    setQuestions(session.questions); setAssessmentToken(saved.token); setAnswers(saved.answers);
    setIndex(saved.index); setDifficulty(session.difficulty); setStage("quiz"); setSubmissionError(null);
  } });
  const { persist: persistDraft, expiresAt } = draft;
  useEffect(() => {
    if (stage === "quiz" && assessmentToken && expiresAt) persistDraft({ purpose: "practice", token: assessmentToken, expiresAt, index, answers });
  }, [stage, assessmentToken, expiresAt, index, answers, persistDraft]);

  const total = questions.length || 10;
  const progress =
    stage === "quiz"
      ? (index / total) * 100
      : stage === "done" || stage === "review"
        ? 100
        : 0;

  async function startTest() {
    if (!draft.ready || loading) return;
    resetTest();
    setLoading(true);
    setResult(null);
    setAnswers({});
    setIndex(0);

    try {
      const courseTitle =
        skillNames.length > 0
          ? `Practice test covering: ${skillNames.join(", ")}`
          : "General programming skills practice";

      const res = await fetch("/api/roadmap/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "practice",
          course_title: courseTitle,
          skill_name: skillNames.join(", "),
          is_skill_assessment: true,
        }),
      });

      if (!res.ok) {
        const errData = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        toast("Failed to generate questions", errData.error || "Try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const qs = data.questions || [];

      if (qs.length === 0) {
        toast("No questions generated", "Please try again.");
        setLoading(false);
        return;
      }

      setQuestions(qs);
      setAssessmentToken(data.assessment_token);
      draft.setExpiresAt(data.expires_at);
      setDifficulty(data.difficulty || 1);
      setStage("quiz");
    } catch (err: any) {
      toast("Network error", err.message);
    }
    setLoading(false);
  }

  async function submitTest() {
    setSubmissionError(null);
    setLoading(true);
    try {
      const answerPayload = questions.map((q) => ({
        question_id: q.id,
        selected_index: answers[q.id] ?? -1,
      }));

      const res = await fetch("/api/practice-test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answerPayload,
          assessment_token: assessmentToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const message = data.error || "Your result could not be confirmed. Please retry saving.";
        setSubmissionError({ message, restart: res.status === 400 && /assessment.*(?:invalid|expired)/i.test(message) });
        setLoading(false);
        return;
      }

      setResult(data);
      draft.discard();
      setQuestions((current) =>
        current.map((q) => ({
          ...q,
          ...data.review?.find((r: any) => r.id === q.id),
        })),
      );
      setStage("done");

      // Adjust difficulty for next test
      const scorePct = data.score || 0;
      if (scorePct >= 80 && difficulty < 5) {
        setDifficulty((d) => Math.min(5, d + 1));
      } else if (scorePct < 40 && difficulty > 1) {
        setDifficulty((d) => Math.max(1, d - 1));
      }

      if (data.newSkillsAdded?.length > 0) {
        toast(
          "New skills unlocked!",
          `Added: ${data.newSkillsAdded.join(", ")}`,
        );
      }
    } catch (err: any) {
      setSubmissionError({ message: err.message || "Your result could not be confirmed. Please retry saving.", restart: false });
    }
    setLoading(false);
  }

  function resetTest() {
    draft.discard();
    setStage("start");
    setQuestions([]);
    setAssessmentToken("");
    setAnswers({});
    setResult(null);
    setIndex(0);
    setSubmissionError(null);
  }

  function discardSession() {
    resetTest();
    requestAnimationFrame(() => startHeading.current?.focus());
  }

  const q = questions[index];
  const diffTone = DIFF_TONES[difficulty] || "neutral";

  // Stats from recent attempts
  const avgScore =
    recentAttempts.length > 0
      ? Math.round(
          recentAttempts.reduce((s, a) => s + a.score, 0) /
            recentAttempts.length,
        )
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 ref={startHeading} tabIndex={-1} className="page-title">The practice lab.</h1>
            <Badge tone="neutral">Practice</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            Try. Learn. Try again. Build confidence across the skills in your
            roadmap.
          </p>
        </div>
        {stage === "start" && (
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted">Difficulty:</div>
            <Badge tone={diffTone as any}>{DIFF_LABELS[difficulty]}</Badge>
          </div>
        )}
      </div>

      {(stage === "start" || stage === "quiz") && <AssessmentDraftNotice message={draft.message} storageAvailable={draft.storageAvailable} retry={draft.retry} expired={draft.expired} onRetry={draft.retryRestore} onDiscard={discardSession} />}

      {/* Start Screen */}
      {stage === "start" && !loading && (
        <div className="mt-8 space-y-4">
          {/* Stats row */}
          <div className="grid sm:grid-cols-3 gap-3">
            <Card className="bg-paper-soft">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-forest">
                  {recentAttempts.length}
                </div>
                <div className="text-xs text-muted mt-1">Recent sessions</div>
              </CardContent>
            </Card>
            <Card className="bg-paper-soft">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-sky">
                  {avgScore != null ? `${avgScore}%` : "—"}
                </div>
                <div className="text-xs text-muted mt-1">Recent average</div>
              </CardContent>
            </Card>
            <Card className="bg-paper-soft">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-amber-800">
                  {DIFF_LABELS[difficulty]}
                </div>
                <div className="text-xs text-muted mt-1">
                  Adaptive difficulty
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-8 text-center !bg-[#e8eddc] rounded-2xl">
              <Dumbbell className="w-12 h-12 text-muted mx-auto" />
              <h3 className="mt-4 text-lg font-semibold">
                A little room to experiment.
              </h3>
              <p className="mt-2 text-sm text-muted max-w-md mx-auto">
                Repeat practice within the shared activity limits. Each session adapts to your
                recent performance and helps update your skill profile.
                {skillNames.length > 0 && (
                  <span className="block mt-2 text-xs text-muted">
                    Skills: {skillNames.join(", ")}
                  </span>
                )}
              </p>
              <p className="mt-4 text-xs leading-6 text-muted">These questions check foundation knowledge. Explore specialist practice and reflection in <Link href="/careers" className="underline text-forest">Career explorer</Link>.</p>
              <Button disabled={!skillNames.length || !draft.ready} onClick={startTest} className="mt-6">
                <Sparkles className="w-4 h-4" />
                Start a practice session
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading */}
      {loading && stage === "start" && (
        <div className="mt-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-forest mx-auto" />
              <div className="mt-4 text-sm text-muted">
                Preparing questions...
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quiz */}
      {stage === "quiz" && q && (
        <div className="mt-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted">
              Question {index + 1} of {questions.length}
            </div>
            <Badge tone={diffTone as any}>{DIFF_LABELS[difficulty]}</Badge>
          </div>
          <Progress value={progress} />

          <Card>
            <CardContent className="p-6">
              <div ref={questionHeading} role="heading" aria-level={2} tabIndex={-1} className="text-lg font-medium" aria-live="polite" aria-atomic="true">{q.prompt}</div>
              <div className="mt-6">
                <QuestionOptions
                  question={q.prompt}
                  options={q.options || []}
                  value={answers[q.id]}
                  onChange={(i) => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  disabled={loading || draft.expired}
                />
              </div>

              {submissionError && <div role="alert" className="mt-5 rounded-xl border border-rust/30 bg-peach p-4 text-sm text-ink"><p className="font-semibold">Your result has not been confirmed</p><p className="mt-2">{submissionError.message}</p>{submissionError.restart ? <Button variant="soft" className="mt-3" onClick={startTest} loading={loading}>Start a new session</Button> : <p className="mt-2">Your answers remain in this tab. Use Finish session to retry the same submission safely.</p>}</div>}

              <div className="flex flex-wrap items-center gap-2 mt-6">
                <Button
                  variant="ghost"
                  disabled={index === 0 || loading}
                  onClick={() => moveQuestion(Math.max(0, index - 1))}
                >
                  <ArrowLeft size={14} />
                  Previous
                </Button>
                <span className="flex-1" />
                <Button variant="ghost" disabled={loading} onClick={discardSession}>
                  Discard session
                </Button>
                <Button
                  disabled={loading || draft.expired || answers[q.id] === undefined}
                  loading={loading}
                  onClick={() => {
                    if (answers[q.id] === undefined)
                      return toast("Pick an answer");
                    if (index + 1 < questions.length) moveQuestion(index + 1);
                    else submitTest();
                  }}
                >
                  {loading
                    ? "Saving answers…"
                    : index + 1 < questions.length
                      ? "Next question"
                      : "Finish session"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results */}
      {stage === "done" && result && (
        <div className="mt-8 space-y-5">
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-paper">
            <CardContent className="p-8 text-center">
              <div
                className={`text-6xl font-bold ${result.score >= 60 ? "text-forest" : "text-rust"}`}
              >
                {result.score}%
              </div>
              <div className="text-lg font-medium mt-2">
                {result.correct_count}/{result.total_count} correct
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 text-sm text-muted">
                <span>+{result.xp_earned} XP</span>
                <span>•</span>
                <span>Level {result.level}</span>
              </div>
              {result.newSkillsAdded?.length > 0 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4 text-forest" />
                  <span className="text-sm text-forest">
                    New skills unlocked: {result.newSkillsAdded.join(", ")}
                  </span>
                </div>
              )}
              <Badge
                tone={
                  result.score >= 80
                    ? "good"
                    : result.score >= 60
                      ? "warn"
                      : "bad"
                }
                className="mt-3"
              >
                {result.score >= 80
                  ? "Ready for a new challenge"
                  : result.score >= 60
                    ? "Good work! Keep practicing"
                    : result.score >= 40
                      ? "Room for improvement"
                      : "Difficulty decreased — review more"}
              </Badge>
            </CardContent>
          </Card>

          {/* Question Review */}
          <Card>
            <CardHeader className="p-6 pb-0">
              <h3 className="text-lg font-semibold">Question Review</h3>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {questions.map((q, qi) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correct_index;
                return (
                  <div
                    key={qi}
                    className={`rounded-xl border p-3 text-sm ${isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}
                  >
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rust shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium">{q.prompt}</div>
                        {!isCorrect && q.correct_index !== undefined && (
                          <div className="text-xs text-muted mt-1">
                            Correct: {q.options[q.correct_index]}
                          </div>
                        )}
                        {q.explanation && (
                          <div className="text-xs text-muted mt-1">
                            {q.explanation}
                          </div>
                        )}
                        <div className="text-xs text-muted mt-1">
                          Skill: {q.skill_name}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={resetTest} className="flex-1">
              <Dumbbell className="w-4 h-4" />
              Start another session
            </Button>
            <Link
              href="/skill-graph"
              className="rounded-2xl bg-paper-soft hover:bg-paper-soft border border-line px-5 py-3 font-medium text-center transition flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              View Progress
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function computeAdaptiveDifficulty(
  attempts: { score: number; difficulty_level: number }[],
): number {
  if (attempts.length === 0) return 1;
  const avg = attempts.reduce((s, a) => s + a.score, 0) / attempts.length;
  const lastDiff = attempts[0]?.difficulty_level || 1;
  if (avg >= 80) return Math.min(5, lastDiff + 1);
  if (avg < 40) return Math.max(1, lastDiff - 1);
  return lastDiff;
}
