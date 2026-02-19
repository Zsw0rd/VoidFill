"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    BarChart, Bar, Cell,
} from "recharts";

const BAR_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f97316", "#ec4899"];

interface Props {
    userGrowthData: { date: string; users: number; newUsers: number }[];
    levelDistribution: { level: string; count: number }[];
}

export function AdminDashboardCharts({ userGrowthData, levelDistribution }: Props) {
    return (
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
            {/* User Growth */}
            <Card className="bg-white/5">
                <CardHeader className="p-5 pb-0">
                    <h2 className="text-lg font-semibold">User Growth</h2>
                    <p className="text-xs text-zinc-500">Cumulative registrations over time</p>
                </CardHeader>
                <CardContent className="p-4 h-[280px]">
                    {userGrowthData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={userGrowthData}>
                                <defs>
                                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
                                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 12 }} />
                                <Area type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={2} fill="url(#userGrad)" name="Total Users" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-zinc-500">No data yet</div>
                    )}
                </CardContent>
            </Card>

            {/* Level Distribution */}
            <Card className="bg-white/5">
                <CardHeader className="p-5 pb-0">
                    <h2 className="text-lg font-semibold">Level Distribution</h2>
                    <p className="text-xs text-zinc-500">Users grouped by level range</p>
                </CardHeader>
                <CardContent className="p-4 h-[280px]">
                    {levelDistribution.some(d => d.count > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={levelDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                <XAxis dataKey="level" tick={{ fill: "#71717a", fontSize: 10 }} />
                                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 12 }} />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Users">
                                    {levelDistribution.map((_, i) => (
                                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-zinc-500">No data yet</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
