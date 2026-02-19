"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/toast/bus";
import Link from "next/link";
import { Brain, Sparkles, Target, BookOpen, TrendingUp, Lightbulb, Clock } from "lucide-react";

type CriticalGap = {
    skill: string;
    currentScore: number;
    targetScore: number;
    gap: number;
    severity: string;
    recommendation: string;
    resources: { title: string; type: string; provider: string; url?: string; estimatedHours?: number }[];
};

type LearningPhase = {
    phase: number;
    title: string;
    duration: string;
    focus: string;
    milestones: string[];
};

type Analysis = {
    overallAssessment: string;
    strengthAreas: string[];
    criticalGaps: CriticalGap[];
    learningPath: LearningPhase[];
    motivationalTip: string;
};

export function AIInsightsClient({ hasRole }: { hasRole: boolean }) {
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [meta, setMeta] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Load cached insights on mount
    useEffect(() => {
        async function loadCached() {
            try {
                const res = await fetch("/api/ai/insights");
                if (res.ok) {
                    const data = await res.json();
                    if (data.cached) {
                        setAnalysis(data.analysis);
                        setMeta(data.meta);
                        setLastUpdated(data.updatedAt);
                    }
                }
            } catch { /* ignore */ }
            setInitialLoading(false);
        }
        if (hasRole) loadCached();
        else setInitialLoading(false);
    }, [hasRole]);

    async function analyze() {
        setLoading(true);
        try {
            const res = await fetch("/api/ai/analyze", { method: "POST" });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: "Unknown error" }));
                toast("Analysis failed", errData.error || "Something went wrong");
                setLoading(false);
                return;
            }
            const data = await res.json();
            setAnalysis(data.analysis);
            setMeta(data.meta);
            setLastUpdated(new Date().toISOString());
            toast("Analysis complete", "Gemini AI has analyzed your skill gaps!");
        } catch (err: any) {
            toast("Network error", err.message);
        }
        setLoading(false);
    }

    function formatDate(iso: string) {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    return (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-semibold">AI Insights</h1>
                        <Badge tone="good">Powered by Gemini</Badge>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">
                        Get AI-powered analysis of your skill gaps with personalized learning recommendations.
                    </p>
                    {lastUpdated && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                            <Clock className="w-3 h-3" />
                            Last analyzed: {formatDate(lastUpdated)}
                        </div>
                    )}
                </div>
                {hasRole && (
                    <Button disabled={loading} onClick={analyze}>
                        <Brain className="w-4 h-4" />
                        {loading ? "Analyzing..." : analysis ? "Re-analyze" : "Analyze My Skills"}
                    </Button>
                )}
            </div>

            {!hasRole && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-zinc-300">
                    Go to <Link href="/onboarding" className="text-zinc-200 hover:underline">onboarding</Link> and pick a target role to unlock AI analysis.
                </div>
            )}

            {(loading || initialLoading) && (
                <div className="mt-8 space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 animate-pulse">
                            <div className="h-5 w-40 rounded-lg bg-white/10" />
                            <div className="mt-3 h-4 w-full rounded-lg bg-white/5" />
                            <div className="mt-2 h-4 w-3/4 rounded-lg bg-white/5" />
                        </div>
                    ))}
                </div>
            )}

            {analysis && !loading && !initialLoading && (
                <div className="mt-8 space-y-6">
                    {/* Overall Assessment */}
                    <Card className="border-zinc-100/20 bg-gradient-to-br from-zinc-100/5 to-zinc-900/50">
                        <CardHeader className="p-6 pb-0">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-zinc-200" />
                                <h2 className="text-xl font-semibold">Overall Assessment</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-zinc-200 leading-relaxed">{analysis.overallAssessment}</p>
                            {meta && (
                                <div className="mt-4 flex gap-4 text-xs text-zinc-400">
                                    <span>{meta.skillCount} skills analyzed</span>
                                    <span>•</span>
                                    <span>{meta.gapCount} gaps identified</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Strengths */}
                    {analysis.strengthAreas?.length > 0 && (
                        <Card>
                            <CardHeader className="p-6 pb-0">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-zinc-200" />
                                    <h2 className="text-xl font-semibold">Your Strengths</h2>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-wrap gap-2">
                                    {analysis.strengthAreas.map((s, i) => (
                                        <Badge key={i} tone="good">{s}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Critical Gaps */}
                    {analysis.criticalGaps?.length > 0 && (
                        <Card>
                            <CardHeader className="p-6 pb-0">
                                <div className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-zinc-300" />
                                    <h2 className="text-xl font-semibold">Skill Gaps &amp; Recommendations</h2>
                                </div>
                                <p className="mt-1 text-sm text-zinc-400">Prioritized by severity and impact on your target role.</p>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {analysis.criticalGaps.map((g, i) => {
                                    const tone = g.severity === "critical" ? "bad" : g.severity === "moderate" ? "warn" : "good";
                                    return (
                                        <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-lg font-semibold">{g.skill}</div>
                                                    <div className="mt-1 text-sm text-zinc-400">
                                                        Score: {g.currentScore}% → Target: {g.targetScore}% | Gap: {g.gap} pts
                                                    </div>
                                                </div>
                                                <Badge tone={tone as any}>{g.severity}</Badge>
                                            </div>
                                            <p className="mt-3 text-sm text-zinc-300 leading-relaxed">{g.recommendation}</p>

                                            {g.resources?.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    <div className="text-xs text-zinc-400 uppercase tracking-wide">Suggested Resources</div>
                                                    {g.resources.map((r, ri) => (
                                                        <div key={ri} className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
                                                            <BookOpen className="w-4 h-4 mt-0.5 text-zinc-400 shrink-0" />
                                                            <div>
                                                                <div className="text-sm font-medium">
                                                                    {r.url ? (
                                                                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-zinc-200 hover:underline">
                                                                            {r.title}
                                                                        </a>
                                                                    ) : (
                                                                        r.title
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-zinc-400">
                                                                    {r.provider} • {r.type}
                                                                    {r.estimatedHours ? ` • ~${r.estimatedHours}h` : ""}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* Learning Path */}
                    {analysis.learningPath?.length > 0 && (
                        <Card>
                            <CardHeader className="p-6 pb-0">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-zinc-300" />
                                    <h2 className="text-xl font-semibold">Personalized Learning Path</h2>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-zinc-100/50 via-zinc-700/50 to-zinc-700/50" />
                                    <div className="space-y-6">
                                        {analysis.learningPath.map((phase, i) => (
                                            <div key={i} className="relative pl-10">
                                                <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-zinc-800 border-2 border-zinc-200/60 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-zinc-200">{phase.phase}</span>
                                                </div>
                                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="font-semibold">{phase.title}</div>
                                                        <Badge tone="neutral">{phase.duration}</Badge>
                                                    </div>
                                                    <p className="mt-2 text-sm text-zinc-300">{phase.focus}</p>
                                                    {phase.milestones?.length > 0 && (
                                                        <div className="mt-3 space-y-1">
                                                            {phase.milestones.map((m, mi) => (
                                                                <div key={mi} className="flex items-center gap-2 text-sm text-zinc-400">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-200/60 shrink-0" />
                                                                    {m}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Motivational Tip */}
                    {analysis.motivationalTip && (
                        <Card className="border-zinc-600/20 bg-gradient-to-br from-zinc-600/5 to-zinc-900/50">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-zinc-200">Motivational Tip</div>
                                        <p className="mt-1 text-sm text-zinc-300 leading-relaxed">{analysis.motivationalTip}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {!analysis && !loading && !initialLoading && hasRole && (
                <div className="mt-8">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Brain className="w-12 h-12 text-zinc-600 mx-auto" />
                            <h3 className="mt-4 text-lg font-semibold">Ready for AI Analysis</h3>
                            <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
                                Click &quot;Analyze My Skills&quot; to get personalized gap analysis, learning recommendations, and a custom roadmap powered by Google Gemini AI.
                            </p>
                            <Button onClick={analyze} className="mt-6">
                                <Brain className="w-4 h-4" />
                                Analyze My Skills
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </motion.div>
    );
}
