"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Radar, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
    LineChart, Line, Legend,
} from "recharts";

interface Props {
    role: any;
    roleSkills: any[];
    userScores: any[];
    attemptHistory?: any[];
}

const COLORS_GAP = ["#f43f5e", "#f97316", "#eab308", "#22c55e"];
function gapColor(gap: number) {
    if (gap >= 60) return COLORS_GAP[0];
    if (gap >= 30) return COLORS_GAP[1];
    if (gap >= 10) return COLORS_GAP[2];
    return COLORS_GAP[3];
}

const LINE_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#ec4899", "#eab308", "#14b8a6", "#f43f5e"];

export function SkillGraphClient({ role, roleSkills, userScores, attemptHistory = [] }: Props) {
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

    // Build trend data from attempt history
    const trendData = useMemo(() => {
        if (!attemptHistory.length) return [];
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
                    {/* Charts Row */}
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

                    {/* Trend Chart */}
                    {trendData && (trendData as any).rows?.length > 0 && (
                        <Card className="mt-4">
                            <CardHeader className="p-6 pb-0">
                                <h2 className="text-xl font-semibold">Score Trends</h2>
                                <p className="mt-1 text-sm text-zinc-400">How your skills improved over time</p>
                            </CardHeader>
                            <CardContent className="p-4 h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={(trendData as any).rows} margin={{ left: 10, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                        <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} />
                                        <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} />
                                        <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 13 }} />
                                        <Legend />
                                        {((trendData as any).skillNames || []).map((name: string, i: number) => (
                                            <Line key={name} type="monotone" dataKey={name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

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
