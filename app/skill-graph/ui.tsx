"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from "recharts";

type RoleSkill = { skill_id: string; weight: number; skills: { name: string } | null };
type UserScore = { skill_id: string; score: number; skills: { name: string } | null };

export function SkillGraphClient({
    role,
    roleSkills,
    userScores,
}: {
    role: any;
    roleSkills: any[];
    userScores: any[];
}) {
    const scoreMap = useMemo(() => {
        const m: Record<string, number> = {};
        userScores.forEach((s) => { m[s.skill_id] = s.score; });
        return m;
    }, [userScores]);

    const radarData = useMemo(() => {
        if (!roleSkills.length) return [];
        return roleSkills.map((rs) => {
            const name = (rs as any).skills?.name || "Skill";
            const benchmark = Math.round(Number(rs.weight) * 100);
            const userScore = scoreMap[rs.skill_id] ?? 0;
            return { skill: name, Benchmark: benchmark, "Your Score": userScore };
        });
    }, [roleSkills, scoreMap]);

    const gapData = useMemo(() => {
        if (!roleSkills.length) return [];
        return roleSkills
            .map((rs) => {
                const name = (rs as any).skills?.name || "Skill";
                const benchmark = Math.round(Number(rs.weight) * 100);
                const userScore = scoreMap[rs.skill_id] ?? 0;
                const gap = Math.max(0, benchmark - userScore);
                return { skill: name, gap, benchmark, userScore };
            })
            .sort((a, b) => b.gap - a.gap);
    }, [roleSkills, scoreMap]);

    const getGapColor = (gap: number) => {
        if (gap >= 60) return "#f87171";
        if (gap >= 30) return "#fb923c";
        if (gap >= 10) return "#fbbf24";
        return "#4ade80";
    };

    return (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold">Skill Graph</h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        {role ? `Visual breakdown for: ${role.name}` : "Select a target role to see your skill graph."}
                    </p>
                </div>
                <Link href="/daily-test" className="rounded-2xl bg-emerald-500/90 hover:bg-emerald-500 px-5 py-3 font-medium text-zinc-950 shadow-soft text-center">
                    Take today&apos;s test
                </Link>
            </div>

            {!role ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-zinc-300">
                    Go to <Link href="/onboarding" className="text-emerald-300 hover:underline">onboarding</Link> and pick a target role to unlock the skill graph.
                </div>
            ) : radarData.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-zinc-300">
                    No skill data yet. Take a <Link href="/daily-test" className="text-emerald-300 hover:underline">daily test</Link> to generate your first scores.
                </div>
            ) : (
                <div className="mt-8 grid lg:grid-cols-2 gap-6">
                    {/* Skill Radar */}
                    <Card>
                        <CardHeader className="p-6 pb-2">
                            <h2 className="text-xl font-semibold">Skill Radar</h2>
                            <p className="mt-1 text-sm text-zinc-400">Your scores vs. role benchmark</p>
                        </CardHeader>
                        <CardContent className="p-4">
                            <ResponsiveContainer width="100%" height={350}>
                                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                    <PolarAngleAxis
                                        dataKey="skill"
                                        tick={{ fill: "#a1a1aa", fontSize: 12 }}
                                    />
                                    <PolarRadiusAxis
                                        angle={30}
                                        domain={[0, 100]}
                                        tick={{ fill: "#71717a", fontSize: 10 }}
                                        axisLine={false}
                                    />
                                    <Radar
                                        name="Benchmark"
                                        dataKey="Benchmark"
                                        stroke="#6366f1"
                                        fill="#6366f1"
                                        fillOpacity={0.25}
                                        strokeWidth={2}
                                    />
                                    <Radar
                                        name="Your Score"
                                        dataKey="Your Score"
                                        stroke="#a78bfa"
                                        fill="#a78bfa"
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                    />
                                    <Legend
                                        wrapperStyle={{ color: "#d4d4d8", fontSize: 12, paddingTop: 16 }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Skill Gaps */}
                    <Card>
                        <CardHeader className="p-6 pb-2">
                            <h2 className="text-xl font-semibold">Skill Gaps</h2>
                            <p className="mt-1 text-sm text-zinc-400">Gap size per skill (higher = more to learn)</p>
                        </CardHeader>
                        <CardContent className="p-4">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={gapData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                                    <YAxis dataKey="skill" type="category" width={100} tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#18181b",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: 12,
                                            color: "#e4e4e7",
                                            fontSize: 13,
                                        }}
                                        formatter={(value: any) => [`${value}`, "Gap"]}
                                    />
                                    <Bar dataKey="gap" radius={[0, 6, 6, 0]} barSize={28}>
                                        {gapData.map((entry, i) => (
                                            <Cell key={i} fill={getGapColor(entry.gap)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="lg:col-span-2 grid sm:grid-cols-3 gap-4">
                        {gapData.map((g) => {
                            const tone = g.gap >= 60 ? "bad" : g.gap >= 30 ? "warn" : "good";
                            return (
                                <Card key={g.skill} className="bg-white/5">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-semibold">{g.skill}</div>
                                            <Badge tone={tone as any}>{g.gap >= 60 ? "Critical" : g.gap >= 30 ? "Moderate" : "On Track"}</Badge>
                                        </div>
                                        <div className="mt-2 text-sm text-zinc-400">
                                            Your score: <span className="text-zinc-200">{g.userScore}%</span> | Benchmark: <span className="text-zinc-200">{g.benchmark}%</span>
                                        </div>
                                        <div className="mt-1 text-sm text-zinc-400">
                                            Gap: <span className="font-medium text-zinc-200">{g.gap} points</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
