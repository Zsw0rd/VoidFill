"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import { toast } from "@/components/toast/bus";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Question = {
  id: string;
  prompt: string;
  options: any;
  skill_id: string;
};

export function DailyTestClient({ existingAttempt }: { existingAttempt: any }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"start" | "quiz" | "done">("start");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);

  const total = questions.length || 10;
  const progress = stage === "quiz" ? ((index) / total) * 100 : stage === "done" ? 100 : 0;

  useEffect(() => {
    if (existingAttempt?.completed_at) {
      setStage("done");
      setResult(existingAttempt);
    }
  }, [existingAttempt]);

  async function start() {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_random_questions", { p_limit: 10 });
    setLoading(false);
    if (error) return toast("Could not load questions", error.message);
    setQuestions(data || []);
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
    const payload = { answers: Object.entries(answers).map(([question_id, selected_index]) => ({ question_id, selected_index })) };
    const res = await fetch("/api/daily-test/submit", { method: "POST", body: JSON.stringify(payload) });
    setLoading(false);
    if (!res.ok) return toast("Submit failed", await res.text());
    const data = await res.json();
    setStage("done");
    setResult(data);
    toast("Done!", `+${data?.xp_earned || 0} XP earned`);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card>
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">Daily Test</h1>
            <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-200">Back</Link>
          </div>
          <p className="mt-1 text-sm text-zinc-400">10 quick questions. Real skill signal.</p>
          <div className="mt-4">
            <Progress value={progress} />
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {stage === "start" ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-zinc-300">Your mission for today</div>
              <div className="mt-1 text-xl font-semibold">Skill check-in</div>
              <div className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Finish the test to update your gap categories and roadmap priorities.
              </div>
              {existingAttempt?.completed_at ? (
                <div className="mt-4">
                  <Badge tone="good">Already completed today</Badge>
                </div>
              ) : (
                <Button disabled={loading} onClick={start} className="mt-5">
                  {loading ? "Loading..." : "Start test"}
                </Button>
              )}
            </div>
          ) : null}

          {stage === "quiz" && q ? (
            <div className="space-y-5">
              <div className="text-sm text-zinc-400">Question {index + 1} of {questions.length}</div>
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
                        active ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="font-medium">{opt}</div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">Pick one and continue</div>
                <Button disabled={loading} onClick={next}>
                  {index + 1 < questions.length ? "Next" : "Finish"}
                </Button>
              </div>
            </div>
          ) : null}

          {stage === "done" ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-zinc-300">Result</div>
              <div className="mt-1 text-2xl font-semibold">{result?.correct_count ?? 0}/{result?.total_count ?? 10} correct</div>
              <div className="mt-2 text-sm text-zinc-400">XP earned: {result?.xp_earned ?? 0}</div>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Link href="/roadmap" className="rounded-2xl bg-emerald-500/90 hover:bg-emerald-500 px-5 py-3 font-medium text-zinc-950 shadow-soft text-center">
                  View updated roadmap
                </Link>
                <Link href="/dashboard" className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 font-medium text-center">
                  Back to dashboard
                </Link>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
