"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Brain, ChevronRight, CheckCircle, XCircle, Sparkles } from "lucide-react";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  difficulty: number;
  skill_name: string;
  explanation: string;
};

export function DailyTestClient({ existingAttempt }: { existingAttempt: any }) {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"start" | "quiz" | "review" | "done">("start");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [difficultyLabel, setDifficultyLabel] = useState("Easy");

  const total = questions.length || 10;
  const progress = stage === "quiz" ? ((index) / total) * 100 : stage === "done" || stage === "review" ? 100 : 0;

  const diffBadgeTone = difficulty <= 2 ? "good" : difficulty <= 3 ? "warn" : "bad";

  // Check if already completed
  if (existingAttempt?.completed_at && stage === "start") {
    return (
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-zinc-200 mx-auto" />
            <h2 className="mt-4 text-2xl font-semibold">Already completed today!</h2>
            <p className="mt-2 text-sm text-zinc-400">Score: {existingAttempt.correct_count}/{existingAttempt.total_count} • XP earned: {existingAttempt.xp_earned}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/roadmap" className="rounded-2xl bg-zinc-100/90 hover:bg-zinc-100 px-5 py-3 font-medium text-zinc-950 shadow-soft text-center">
                View roadmap
              </Link>
              <Link href="/dashboard" className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 font-medium text-center">
                Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  async function start() {
    setLoading(true);
    // Try AI-generated questions first
    try {
      const res = await fetch("/api/ai/generate-questions", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setDifficulty(data.difficulty || 1);
        setDifficultyLabel(data.difficultyLabel || "Easy");
        setStage("quiz");
        setIndex(0);
        setAnswers({});
        setLoading(false);
        return;
      }
    } catch {
      // Fallback below
    }

    // Fallback to database questions
    const { createClient } = await import("@/lib/supabase/browser");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_random_questions", { p_limit: 10 });
    setLoading(false);
    if (error) return toast("Could not load questions", error.message);
    setQuestions((data || []).map((q: any) => ({ ...q, difficulty: 1, skill_name: "General", explanation: "" })));
    setStage("quiz");
    setIndex(0);
    setAnswers({});
  }

  const q = questions[index];

  function pick(optIdx: number) {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.id]: optIdx }));
  }

  function next() {
    if (!q) return;
    if (answers[q.id] === undefined) return toast("Pick an option", "Choose one answer to continue.");
    if (index + 1 < questions.length) setIndex((i) => i + 1);
    else submit();
  }

  async function submit() {
    setLoading(true);
    const payload = {
      answers: Object.entries(answers).map(([question_id, selected_index]) => ({ question_id, selected_index })),
      ai_questions: questions.map(q => ({ id: q.id, correct_index: q.correct_index, skill_name: q.skill_name })),
      difficulty_level: difficulty,
    };
    const res = await fetch("/api/daily-test/submit", { method: "POST", body: JSON.stringify(payload) });
    setLoading(false);
    if (!res.ok) return toast("Submit failed", await res.text());
    const data = await res.json();
    setResult(data);
    setStage("review");
    toast("Done!", `+${data?.xp_earned || 0} XP earned`);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card>
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Daily Test</h1>
              <p className="mt-1 text-sm text-zinc-400">AI-powered adaptive assessment</p>
            </div>
            <div className="flex items-center gap-2">
              {stage !== "start" && (
                <Badge tone={diffBadgeTone as any}>
                  {difficultyLabel} (Lvl {difficulty})
                </Badge>
              )}
              <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-200">Back</Link>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} />
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {stage === "start" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-zinc-200" />
                <div>
                  <div className="text-xl font-semibold">AI Skill Assessment</div>
                  <div className="mt-1 text-sm text-zinc-400">Questions adapt to your skill level</div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-zinc-200" /> Questions target your weak areas
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-zinc-300" /> Difficulty scales based on performance
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-zinc-300" /> Get explanations after each test
                </div>
              </div>
              <Button disabled={loading} onClick={start} className="mt-5">
                {loading ? "Generating questions..." : "Start AI Test"}
              </Button>
            </div>
          )}

          {stage === "quiz" && q && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-400">Question {index + 1} of {questions.length}</div>
                <Badge tone="neutral">{q.skill_name}</Badge>
              </div>
              <div className="text-xl font-semibold leading-snug">{q.prompt}</div>

              <div className="grid gap-3">
                {(q.options || []).map((opt: string, i: number) => {
                  const active = answers[q.id] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => pick(i)}
                      className={[
                        "text-left rounded-2xl border p-4 transition",
                        active ? "border-zinc-200/40 bg-zinc-100/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-medium shrink-0 ${active ? "border-zinc-200 text-zinc-200" : "border-white/20 text-zinc-400"}`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div className="font-medium">{opt}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">Pick one and continue</div>
                <Button disabled={loading} onClick={next}>
                  {index + 1 < questions.length ? (
                    <>Next <ChevronRight className="w-4 h-4" /></>
                  ) : "Finish"}
                </Button>
              </div>
            </div>
          )}

          {stage === "review" && (
            <div className="space-y-6">
              {/* Score Summary */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-100/5 to-zinc-900/50 p-6 text-center">
                <div className="text-4xl font-bold">{result?.correct_count ?? 0}/{result?.total_count ?? 10}</div>
                <div className="mt-1 text-sm text-zinc-400">Correct answers • +{result?.xp_earned ?? 0} XP earned</div>
                <div className="mt-3">
                  <Badge tone={diffBadgeTone as any}>Difficulty: {difficultyLabel}</Badge>
                </div>
              </div>

              {/* Per-question review */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Question Review</h3>
                {questions.map((question, qi) => {
                  const userAnswer = answers[question.id];
                  const isCorrect = userAnswer === question.correct_index;
                  return (
                    <div key={qi} className={`rounded-2xl border p-4 ${isCorrect ? "border-zinc-100/20 bg-zinc-100/5" : "border-zinc-700/20 bg-zinc-700/5"}`}>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-zinc-200 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{question.prompt}</div>
                          <div className="mt-2 text-xs text-zinc-400">
                            Your answer: <span className={isCorrect ? "text-zinc-200" : "text-zinc-300"}>{question.options[userAnswer]}</span>
                            {!isCorrect && (
                              <> • Correct: <span className="text-zinc-200">{question.options[question.correct_index]}</span></>
                            )}
                          </div>
                          {question.explanation && (
                            <div className="mt-2 text-xs text-zinc-300 bg-white/5 rounded-xl p-3">{question.explanation}</div>
                          )}
                        </div>
                        <Badge tone="neutral">{question.skill_name}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/roadmap" className="rounded-2xl bg-zinc-100/90 hover:bg-zinc-100 px-5 py-3 font-medium text-zinc-950 shadow-soft text-center flex-1">
                  View updated roadmap
                </Link>
                <Link href="/skill-graph" className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 font-medium text-center flex-1">
                  See skill graph
                </Link>
                <Link href="/dashboard" className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 font-medium text-center flex-1">
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
