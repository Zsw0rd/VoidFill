"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Radar, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
    LineChart, Line, Legend,
    AreaChart, Area,
    PieChart, Pie,
} from "recharts";

interface Props {
    role: any;
    roleSkills: any[];
    userScores: any[];
    attemptHistory?: any[];
    practiceHistory?: any[];
}

const COLORS_GAP = ["#f43f5e", "#f97316", "#eab308", "#22c55e"];
function gapColor(gap: number) {
    if (gap >= 60) return COLORS_GAP[0];
    if (gap >= 30) return COLORS_GAP[1];
    if (gap >= 10) return COLORS_GAP[2];
    return COLORS_GAP[3];
}

const LINE_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#ec4899", "#eab308", "#14b8a6", "#f43f5e"];
const PIE_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#ec4899", "#eab308", "#14b8a6", "#f43f5e"];

type AdditionalGraph = "score_trends" | "practice_perf" | "score_distribution" | "progress_area";

const GRAPH_OPTIONS: { value: AdditionalGraph; label: string }[] = [
    { value: "score_trends", label: "Score Trends Over Time" },
    { value: "practice_perf", label: "Practice Test Performance" },
    { value: "score_distribution", label: "Score Distribution (Pie)" },
    { value: "progress_area", label: "Cumulative Progress (Area)" },
];

export function SkillGraphClient({ role, roleSkills, userScores, attemptHistory = [], practiceHistory = [] }: Props) {
    const [selectedGraph, setSelectedGraph] = useState<AdditionalGraph>("score_trends");

    const scoreMap = useMemo(() => {
        const m = new Map<string, number>();
        userScores.forEach((s: any) => m.set(s.skill_id, Number(s.score ?? 0)));
        return m;
    }, [userScores]);

    const radarData = useMemo(() => {
        return roleSkills.map((rs: any) => ({
            skill: rs.skills?.name ?? "?",
            you: scoreMap.get(rs.skill_id) ?? 0,
            benchmark: Math.round(Number(rs.weight ?? 0.8) * 100),
        }));
    }, [roleSkills, scoreMap]);

    const gapData = useMemo(() => {
        return roleSkills.map((rs: any) => {
            const benchmark = Math.round(Number(rs.weight ?? 0.8) * 100);
            const you = scoreMap.get(rs.skill_id) ?? 0;
            return { skill: rs.skills?.name ?? "?", gap: Math.max(0, benchmark - you), you, benchmark };
        }).sort((a, b) => b.gap - a.gap);
    }, [roleSkills, scoreMap]);

    // Score trends
    const trendData = useMemo(() => {
        if (!attemptHistory.length) return null;
        const skillNames = new Set<string>();
        const rows: any[] = [];
        attemptHistory.forEach((attempt: any) => {
            const row: any = { date: attempt.attempt_date };
            (attempt.attempt_skill_scores || []).forEach((ss: any) => {
                const name = ss.skills?.name || "Unknown";
                skillNames.add(name);
                row[name] = ss.score;
            });
            rows.push(row);
        });
        return { rows, skillNames: Array.from(skillNames) };
    }, [attemptHistory]);

    // Practice test data
    const practiceData = useMemo(() => {
        return practiceHistory.map((p: any, i: number) => ({
            test: `#${i + 1}`,
            score: p.score,
            difficulty: p.difficulty_level * 20,
        }));
    }, [practiceHistory]);

    // Score distribution (pie chart)
    const distributionData = useMemo(() => {
        const ranges = { "0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0 };
        userScores.forEach((s: any) => {
            const score = Number(s.score ?? 0);
            if (score <= 25) ranges["0-25"]++;
            else if (score <= 50) ranges["26-50"]++;
            else if (score <= 75) ranges["51-75"]++;
            else ranges["76-100"]++;
        });
        return Object.entries(ranges).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
    }, [userScores]);

    // Cumulative progress (area chart)
    const areaData = useMemo(() => {
        if (!attemptHistory.length) return [];
        return attemptHistory.map((a: any) => ({
            date: a.attempt_date,
            score: a.score ?? 0,
        }));
    }, [attemptHistory]);

    const summaryCards = useMemo(() => {
        return roleSkills.map((rs: any) => {
            const score = scoreMap.get(rs.skill_id) ?? 0;
            const benchmark = Math.round(Number(rs.weight ?? 0.8) * 100);
            const gap = Math.max(0, benchmark - score);
            const cat = gap >= 40 ? "Critical" : gap >= 15 ? "Moderate" : "On Track";
            const tone = cat === "Critical" ? "bad" : cat === "Moderate" ? "warn" : "good";
            return { name: rs.skills?.name ?? "?", score, benchmark, gap, cat, tone };
        });
    }, [roleSkills, scoreMap]);

    return (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <h1 className="text-3xl font-semibold">Skill Graph</h1>
            <p className="mt-2 text-sm text-zinc-400">{role ? `Target: ${role.name}` : "Select a target role in onboarding."}</p>

            {!role || !roleSkills.length ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-zinc-300">
                    No role skills to visualize. Select a target role and take a daily test first.
                </div>
            ) : (
                <>
                    {/* ═══════════ Permanent Charts: Radar + Gap ═══════════ */}
                    <div className="mt-8 grid lg:grid-cols-2 gap-4">
                        {/* Radar */}
                        <Card>
                            <CardHeader className="p-6 pb-0">
                                <h2 className="text-xl font-semibold">Skill Radar</h2>
                                <p className="mt-1 text-sm text-zinc-400">Your scores vs role benchmark</p>
                            </CardHeader>
                            <CardContent className="p-4 h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="#ffffff10" />
                                        <PolarAngleAxis dataKey="skill" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                                        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 10 }} />
                                        <Radar name="You" dataKey="you" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
                                        <Radar name="Benchmark" dataKey="benchmark" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                                        <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 13 }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Gap Bar */}
                        <Card>
                            <CardHeader className="p-6 pb-0">
                                <h2 className="text-xl font-semibold">Skill Gap</h2>
                                <p className="mt-1 text-sm text-zinc-400">How far from the benchmark</p>
                            </CardHeader>
                            <CardContent className="p-4 h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={gapData} layout="vertical" margin={{ left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                        <XAxis type="number" domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} />
                                        <YAxis type="category" dataKey="skill" width={100} tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                                        <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 13 }} formatter={(value: any) => [`${value} pts`, "Gap"]} />
                                        <Bar dataKey="gap" radius={[0, 6, 6, 0]}>
                                            {gapData.map((d: any, i: number) => (<Cell key={i} fill={gapColor(d.gap)} />))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ═══════════ Selectable Additional Graph ═══════════ */}
                    <Card className="mt-4">
                        <CardHeader className="p-6 pb-0">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Additional Insights</h2>
                                <select
                                    value={selectedGraph}
                                    onChange={(e) => setSelectedGraph(e.target.value as AdditionalGraph)}
                                    className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
                                >
                                    {GRAPH_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 h-[350px]">
                            {/* Score Trends */}
                            {selectedGraph === "score_trends" && (
                                trendData && trendData.rows.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trendData.rows} margin={{ left: 10, right: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                            <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} />
                                            <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} />
                                            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 13 }} />
                                            <Legend />
                                            {trendData.skillNames.map((name: string, i: number) => (
                                                <Line key={name} type="monotone" dataKey={name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-sm text-zinc-500">Take daily tests to see score trends</div>
                                )
                            )}

                            {/* Practice Performance */}
                            {selectedGraph === "practice_perf" && (
                                practiceData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={practiceData} margin={{ left: 10, right: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                            <XAxis dataKey="test" tick={{ fill: "#71717a", fontSize: 11 }} />
                                            <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} />
                                            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 13 }} />
                                            <Legend />
                                            <Line type="monotone" dataKey="score" name="Score %" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                                            <Line type="monotone" dataKey="difficulty" name="Difficulty" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-sm text-zinc-500">Take practice tests to see performance data</div>
                                )
                            )}

                            {/* Score Distribution */}
                            {selectedGraph === "score_distribution" && (
                                distributionData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }: any) => `${name}: ${value}`}>
                                                {distributionData.map((_: any, i: number) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 13 }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-sm text-zinc-500">No score data available</div>
                                )
                            )}

                            {/* Cumulative Progress (Area) */}
                            {selectedGraph === "progress_area" && (
                                areaData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={areaData} margin={{ left: 10, right: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                            <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} />
                                            <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} />
                                            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 13 }} />
                                            <Area type="monotone" dataKey="score" name="Overall Score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-sm text-zinc-500">Take daily tests to see progress</div>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {summaryCards.map((c) => (
                            <Card key={c.name} className="bg-white/5">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold">{c.name}</div>
                                        <Badge tone={c.tone as any}>{c.cat}</Badge>
                                    </div>
                                    <Progress value={c.score} />
                                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                                        <span>Score: {c.score}%</span>
                                        <span>Benchmark: {c.benchmark}%</span>
                                    </div>
                                    {c.gap > 0 && <div className="mt-1 text-xs text-zinc-500">Gap: {c.gap} points</div>}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </motion.div>
    );
}
