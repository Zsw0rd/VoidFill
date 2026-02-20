"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    BarChart, Bar, Cell, Legend,
} from "recharts";

const BAR_COLORS = ["#34d399", "#60a5fa", "#c084fc", "#fb923c", "#f472b6"];

interface Props {
    userGrowthData: { date: string; users: number; newUsers: number }[];
    levelDistribution: { level: string; count: number }[];
}

export function AdminDashboardCharts({ userGrowthData, levelDistribution }: Props) {
    return (
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
            <Card className="bg-white/5">
                <CardHeader className="p-5 pb-2">
                    <h2 className="text-base font-semibold">User Growth</h2>
                    <p className="text-[11px] text-zinc-500">Cumulative registrations</p>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="w-full" style={{ height: 220 }}>
                        {userGrowthData.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={userGrowthData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                                    <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ background: "#1a1a1d", border: "1px solid #ffffff12", borderRadius: 10, fontSize: 11, padding: "8px 12px" }}
                                        labelStyle={{ color: "#a1a1aa", marginBottom: 4 }}
                                    />
                                    <Area type="monotone" dataKey="users" stroke="#34d399" strokeWidth={2} fill="url(#userGrad)" name="Total" dot={false} />
                                    <Area type="monotone" dataKey="newUsers" stroke="#60a5fa" strokeWidth={1.5} fill="none" name="New" dot={false} strokeDasharray="4 3" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-zinc-600">
                                {userGrowthData.length === 1 ? "Need 2+ data points" : "No users yet"}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/5">
                <CardHeader className="p-5 pb-2">
                    <h2 className="text-base font-semibold">Level Distribution</h2>
                    <p className="text-[11px] text-zinc-500">Users by level range</p>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="w-full" style={{ height: 220 }}>
                        {levelDistribution.some(d => d.count > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={levelDistribution} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                                    <XAxis dataKey="level" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ background: "#1a1a1d", border: "1px solid #ffffff12", borderRadius: 10, fontSize: 11, padding: "8px 12px" }}
                                        cursor={{ fill: "#ffffff05" }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Users" barSize={36}>
                                        {levelDistribution.map((_, i) => (
                                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-zinc-600">No data yet</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
