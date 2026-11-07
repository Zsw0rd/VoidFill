"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";

const BAR_COLORS = [
  "#32634b",
  "#3f617e",
  "#c084fc",
  "#bd482c",
  "#f472b6",
  "#facc15",
  "#2dd4bf",
];

interface Props {
  avgSkillData: { skill: string; avgScore: number }[];
  studentProgressData: { name: string; xp: number; level: number }[];
}

export function MentorDashboardCharts({
  avgSkillData,
  studentProgressData,
}: Props) {
  return (
    <div className="mt-6 grid lg:grid-cols-2 gap-4">
      <Card className="bg-paper-soft">
        <CardHeader className="p-5 pb-2">
          <h2 className="text-base font-semibold">Skill Overview</h2>
          <p className="text-[11px] text-muted">
            Average scores across students
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="w-full" style={{ height: 240 }}>
            {avgSkillData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={avgSkillData}
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                >
                  <PolarGrid stroke="#dddfd5" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "#697168", fontSize: 9 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fill: "#697168", fontSize: 8 }}
                    axisLine={false}
                  />
                  <Radar
                    name="Avg Score"
                    dataKey="avgScore"
                    stroke="#32634b"
                    strokeWidth={2}
                    fill="#32634b"
                    fillOpacity={0.15}
                    dot={{ r: 3, fill: "#32634b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #dddfd5",
                      borderRadius: 10,
                      fontSize: 11,
                      padding: "8px 12px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted">
                No skill data yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-paper-soft">
        <CardHeader className="p-5 pb-2">
          <h2 className="text-base font-semibold">Student XP</h2>
          <p className="text-[11px] text-muted">XP earned by each student</p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="w-full" style={{ height: 240 }}>
            {studentProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={studentProgressData}
                  layout="vertical"
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e7e9e0"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#697168", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: "#697168", fontSize: 10 }}
                    width={70}
                    axisLine={false}
                    tickLine={false}
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
                    dataKey="xp"
                    radius={[0, 6, 6, 0]}
                    name="XP"
                    barSize={20}
                  >
                    {studentProgressData.map((_, i) => (
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
                No students yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
