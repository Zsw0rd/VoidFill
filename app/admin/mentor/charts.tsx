"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Radar, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";

const BAR_COLORS = ["#34d399", "#60a5fa", "#c084fc", "#fb923c", "#f472b6", "#facc15", "#2dd4bf"];

interface Props {
    avgSkillData: { skill: string; avgScore: number }[];
    studentProgressData: { name: string; xp: number; level: number }[];
}

export function MentorDashboardCharts({ avgSkillData, studentProgressData }: Props) {
    return (
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
            <Card className="bg-white/5">
                <CardHeader className="p-5 pb-2">
                    <h2 className="text-base font-semibold">Skill Overview</h2>
                    <p className="text-[11px] text-zinc-500">Average scores across students</p>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="w-full" style={{ height: 240 }}>
                        {avgSkillData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={avgSkillData} cx="50%" cy="50%" outerRadius="70%">
                                    <PolarGrid stroke="#ffffff0a" />
                                    <PolarAngleAxis dataKey="skill" tick={{ fill: "#a1a1aa", fontSize: 9 }} />
                                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#52525b", fontSize: 8 }} axisLine={false} />
                                    <Radar name="Avg Score" dataKey="avgScore" stroke="#34d399" strokeWidth={2} fill="#34d399" fillOpacity={0.15} dot={{ r: 3, fill: "#34d399" }} />
                                    <Tooltip contentStyle={{ background: "#1a1a1d", border: "1px solid #ffffff12", borderRadius: 10, fontSize: 11, padding: "8px 12px" }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-zinc-600">No skill data yet</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/5">
                <CardHeader className="p-5 pb-2">
                    <h2 className="text-base font-semibold">Student XP</h2>
                    <p className="text-[11px] text-zinc-500">XP earned by each student</p>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="w-full" style={{ height: 240 }}>
                        {studentProgressData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={studentProgressData} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="name" type="category" tick={{ fill: "#a1a1aa", fontSize: 10 }} width={70} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: "#1a1a1d", border: "1px solid #ffffff12", borderRadius: 10, fontSize: 11, padding: "8px 12px" }} cursor={{ fill: "#ffffff05" }} />
                                    <Bar dataKey="xp" radius={[0, 6, 6, 0]} name="XP" barSize={20}>
                                        {studentProgressData.map((_, i) => (
                                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-zinc-600">No students yet</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
