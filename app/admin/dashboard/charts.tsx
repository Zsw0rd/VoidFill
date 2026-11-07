"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";

const BAR_COLORS = ["#32634b", "#3f617e", "#c084fc", "#bd482c", "#f472b6"];

interface Props {
  userGrowthData: { date: string; users: number; newUsers: number }[];
  levelDistribution: { level: string; count: number }[];
}

export function AdminDashboardCharts({
  userGrowthData,
  levelDistribution,
}: Props) {
  return (
    <div className="mt-6 grid lg:grid-cols-2 gap-4">
      <Card className="bg-paper-soft">
        <CardHeader className="p-5 pb-2">
          <h2 className="text-base font-semibold">User Growth</h2>
          <p className="text-[11px] text-muted">Cumulative registrations</p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="w-full" style={{ height: 220 }}>
            {userGrowthData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={userGrowthData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#32634b"
                        stopOpacity={0.35}
                      />
                      <stop offset="100%" stopColor="#32634b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e9e0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#697168", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#697168", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #dddfd5",
                      borderRadius: 10,
                      fontSize: 11,
                      padding: "8px 12px",
                    }}
                    labelStyle={{ color: "#697168", marginBottom: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#32634b"
                    strokeWidth={2}
                    fill="url(#userGrad)"
                    name="Total"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stroke="#3f617e"
                    strokeWidth={1.5}
                    fill="none"
                    name="New"
                    dot={false}
                    strokeDasharray="4 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted">
                {userGrowthData.length === 1
                  ? "Need 2+ data points"
                  : "No users yet"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-paper-soft">
        <CardHeader className="p-5 pb-2">
          <h2 className="text-base font-semibold">Level Distribution</h2>
          <p className="text-[11px] text-muted">Users by level range</p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="w-full" style={{ height: 220 }}>
            {levelDistribution.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={levelDistribution}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e9e0" />
                  <XAxis
                    dataKey="level"
                    tick={{ fill: "#697168", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#697168", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #dddfd5",
                      borderRadius: 10,
                      fontSize: 11,
                      padding: "8px 12px",
                    }}
                    cursor={{ fill: "#eeeee7" }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    name="Users"
                    barSize={36}
                  >
                    {levelDistribution.map((_, i) => (
                      <Cell
                        key={i}
                        fill={BAR_COLORS[i % BAR_COLORS.length]}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted">
                No data yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
