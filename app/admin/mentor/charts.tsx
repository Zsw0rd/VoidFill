"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Radar, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";

const BAR_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f97316", "#ec4899", "#eab308", "#14b8a6"];

interface Props {
    avgSkillData: { skill: string; avgScore: number }[];
    studentProgressData: { name: string; xp: number; level: number }[];
}

export function MentorDashboardCharts({ avgSkillData, studentProgressData }: Props) {
    return (
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
            {/* Student Skill Radar */}
            <Card className="bg-white/5">
                <CardHeader className="p-5 pb-0">
                    <h2 className="text-lg font-semibold">Student Skill Overview</h2>
                    <p className="text-xs text-zinc-500">Average scores across all students</p>
                </CardHeader>
                <CardContent className="p-4 h-[300px]">
                    {avgSkillData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={avgSkillData}>
                                <PolarGrid stroke="#ffffff10" />
                                <PolarAngleAxis dataKey="skill" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 9 }} />
                                <Radar name="Avg Score" dataKey="avgScore" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
                                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 12 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-zinc-500">No skill data yet</div>
                    )}
                </CardContent>
            </Card>

            {/* Student Progress Bar */}
            <Card className="bg-white/5">
                <CardHeader className="p-5 pb-0">
                    <h2 className="text-lg font-semibold">Student XP Progress</h2>
                    <p className="text-xs text-zinc-500">XP earned by each student</p>
                </CardHeader>
                <CardContent className="p-4 h-[300px]">
                    {studentProgressData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={studentProgressData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} />
                                <YAxis dataKey="name" type="category" tick={{ fill: "#a1a1aa", fontSize: 10 }} width={80} />
                                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 12 }} />
                                <Bar dataKey="xp" radius={[0, 8, 8, 0]} name="XP">
                                    {studentProgressData.map((_, i) => (
                                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-zinc-500">No students yet</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
