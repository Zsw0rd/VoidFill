"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Dumbbell, CheckCircle, XCircle, TrendingUp, Sparkles, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

type Question = {
    id: string;
    prompt: string;
    options: string[];
    correct_index: number;
    difficulty: number;
    skill_name: string;
    explanation: string;
};

interface Props {
    recentAttempts: { score: number; difficulty_level: number; created_at: string }[];
    skillNames: string[];
}

const DIFF_LABELS = ["", "Easy", "Moderate", "Intermediate", "Hard", "Expert"];
const DIFF_TONES: Record<number, string> = { 1: "good", 2: "good", 3: "warn", 4: "bad", 5: "bad" };

export function PracticeTestClient({ recentAttempts, skillNames }: Props) {
    const [stage, setStage] = useState<"start" | "quiz" | "review" | "done">("start");
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [result, setResult] = useState<any>(null);
    const [difficulty, setDifficulty] = useState(() => computeAdaptiveDifficulty(recentAttempts));

    const total = questions.length || 10;
    const progress = stage === "quiz" ? ((index) / total) * 100 : stage === "done" || stage === "review" ? 100 : 0;

    async function startTest() {
        setLoading(true);
        setResult(null);
        setAnswers({});
        setIndex(0);

        try {
            const courseTitle = skillNames.length > 0
                ? `Practice test covering: ${skillNames.join(", ")}`
                : "General programming skills practice";

            const res = await fetch("/api/roadmap/assess", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    course_title: courseTitle,
                    skill_name: skillNames.join(", "),
                    is_skill_assessment: true,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: "Unknown error" }));
                toast("Failed to generate questions", errData.error || "Try again.");
                setLoading(false);
                return;
            }

            const data = await res.json();
            const qs = (data.questions || []).map((q: any) => ({
                ...q,
                skill_name: q.skill_name || skillNames[0] || "General",
            }));

            if (qs.length === 0) {
                toast("No questions generated", "Please try again.");
                setLoading(false);
                return;
            }

            setQuestions(qs);
            setStage("quiz");
        } catch (err: any) {
            toast("Network error", err.message);
        }
        setLoading(false);
    }

    async function submitTest() {
        setLoading(true);
        try {
            const answerPayload = questions.map((q) => ({
                question_id: q.id,
                selected_index: answers[q.id] ?? -1,
            }));

            const aiQs = questions.map((q) => ({
                id: q.id,
                correct_index: q.correct_index,
                skill_name: q.skill_name,
            }));

            const res = await fetch("/api/practice-test/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers: answerPayload,
                    ai_questions: aiQs,
                    difficulty_level: difficulty,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast("Submit failed", data.error || "Unknown error");
                setLoading(false);
                return;
            }

            setResult(data);
            setStage("done");

            // Adjust difficulty for next test
            const scorePct = data.score || 0;
            if (scorePct >= 80 && difficulty < 5) {
                setDifficulty(d => Math.min(5, d + 1));
            } else if (scorePct < 40 && difficulty > 1) {
                setDifficulty(d => Math.max(1, d - 1));
            }

            if (data.newSkillsAdded?.length > 0) {
                toast("New skills unlocked!", `Added: ${data.newSkillsAdded.join(", ")}`);
            }
        } catch (err: any) {
            toast("Network error", err.message);
        }
        setLoading(false);
    }

    function resetTest() {
        setStage("start");
        setQuestions([]);
        setAnswers({});
        setResult(null);
        setIndex(0);
    }

    const q = questions[index];
    const diffTone = DIFF_TONES[difficulty] || "neutral";

    // Stats from recent attempts
    const avgScore = recentAttempts.length > 0
        ? Math.round(recentAttempts.reduce((s, a) => s + a.score, 0) / recentAttempts.length)
        : null;

    return (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-semibold">Practice Test</h1>
                        <Badge tone="neutral">Unlimited</Badge>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">
                        Take unlimited practice tests across all your roadmap skills. Difficulty adapts to your performance.
                    </p>
                </div>
                {stage === "start" && (
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-zinc-400">Difficulty:</div>
                        <Badge tone={diffTone as any}>{DIFF_LABELS[difficulty]}</Badge>
                    </div>
                )}
            </div>

            {/* Start Screen */}
            {stage === "start" && !loading && (
                <div className="mt-8 space-y-4">
                    {/* Stats row */}
                    <div className="grid sm:grid-cols-3 gap-3">
                        <Card className="bg-white/5">
                            <CardContent className="p-5 text-center">
                                <div className="text-2xl font-bold text-emerald-400">{recentAttempts.length}</div>
                                <div className="text-xs text-zinc-400 mt-1">Tests Taken</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/5">
                            <CardContent className="p-5 text-center">
                                <div className="text-2xl font-bold text-blue-400">{avgScore != null ? `${avgScore}%` : "—"}</div>
                                <div className="text-xs text-zinc-400 mt-1">Avg Score</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/5">
                            <CardContent className="p-5 text-center">
                                <div className="text-2xl font-bold text-amber-400">{DIFF_LABELS[difficulty]}</div>
                                <div className="text-xs text-zinc-400 mt-1">Current Level</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardContent className="p-8 text-center">
                            <Dumbbell className="w-12 h-12 text-zinc-600 mx-auto" />
                            <h3 className="mt-4 text-lg font-semibold">Ready to Practice</h3>
                            <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
                                AI generates 8 questions from your roadmap skills. Score ≥80% to increase difficulty; &lt;40% to decrease it.
                                {skillNames.length > 0 && (
                                    <span className="block mt-2 text-xs text-zinc-500">
                                        Skills: {skillNames.join(", ")}
                                    </span>
                                )}
                            </p>
                            <Button onClick={startTest} className="mt-6">
                                <Sparkles className="w-4 h-4" />
                                Start Practice Test
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
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
                            <div className="mt-4 text-sm text-zinc-400">Generating questions...</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Quiz */}
            {stage === "quiz" && q && (
                <div className="mt-8 space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-zinc-400">Question {index + 1} of {questions.length}</div>
                        <Badge tone={diffTone as any}>{DIFF_LABELS[difficulty]}</Badge>
                    </div>
                    <Progress value={progress} />

                    <Card>
                        <CardContent className="p-6">
                            <div className="text-lg font-medium">{q.prompt}</div>
                            <div className="mt-4 grid gap-3">
                                {(q.options || []).map((opt, i) => {
                                    const active = answers[q.id] === i;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setAnswers(a => ({ ...a, [q.id]: i }))}
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

                            <div className="flex justify-end gap-2 mt-5">
                                <Button variant="soft" onClick={resetTest}>Cancel</Button>
                                <Button onClick={() => {
                                    if (answers[q.id] === undefined) return toast("Pick an answer");
                                    if (index + 1 < questions.length) setIndex(i => i + 1);
                                    else submitTest();
                                }}>
                                    {index + 1 < questions.length ? "Next" : "Submit"}
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
                    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-zinc-900/50">
                        <CardContent className="p-8 text-center">
                            <div className={`text-6xl font-bold ${result.score >= 60 ? "text-emerald-400" : "text-rose-400"}`}>
                                {result.score}%
                            </div>
                            <div className="text-lg font-medium mt-2">{result.correct_count}/{result.total_count} correct</div>
                            <div className="mt-2 flex items-center justify-center gap-3 text-sm text-zinc-400">
                                <span>+{result.xp_earned} XP</span>
                                <span>•</span>
                                <span>Level {result.level}</span>
                            </div>
                            {result.newSkillsAdded?.length > 0 && (
                                <div className="mt-3 flex items-center justify-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm text-emerald-300">New skills unlocked: {result.newSkillsAdded.join(", ")}</span>
                                </div>
                            )}
                            <Badge tone={result.score >= 80 ? "good" : result.score >= 60 ? "warn" : "bad"} className="mt-3">
                                {result.score >= 80 ? "Difficulty increased! 🚀" : result.score >= 60 ? "Good work! Keep practicing" : result.score >= 40 ? "Room for improvement" : "Difficulty decreased — review more"}
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
                                    <div key={qi} className={`rounded-xl border p-3 text-sm ${isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}>
                                        <div className="flex items-start gap-2">
                                            {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                                            <div>
                                                <div className="font-medium">{q.prompt}</div>
                                                {!isCorrect && <div className="text-xs text-zinc-400 mt-1">Correct: {q.options[q.correct_index]}</div>}
                                                {q.explanation && <div className="text-xs text-zinc-300 mt-1">{q.explanation}</div>}
                                                <div className="text-xs text-zinc-500 mt-1">Skill: {q.skill_name}</div>
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
                            Take Another Test
                        </Button>
                        <Link href="/skill-graph" className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 font-medium text-center transition flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            View Progress
                        </Link>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function computeAdaptiveDifficulty(attempts: { score: number; difficulty_level: number }[]): number {
    if (attempts.length === 0) return 1;
    const avg = attempts.reduce((s, a) => s + a.score, 0) / attempts.length;
    const lastDiff = attempts[0]?.difficulty_level || 1;
    if (avg >= 80) return Math.min(5, lastDiff + 1);
    if (avg < 40) return Math.max(1, lastDiff - 1);
    return lastDiff;
}
