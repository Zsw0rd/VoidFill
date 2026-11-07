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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
const LINE_COLORS = [
  "#32634b",
  "#3f617e",
  "#bd482c",
  "#a855f7",
  "#ec4899",
  "#a4832e",
  "#14b8a6",
];
export function ProfileCharts({radarData,trendData}: {radarData:{skill:string;you:number|null;benchmark:number}[];trendData:{rows:Record<string,any>[];skillNames:string[]}|null}) {
  return (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-5 pb-0">
              <h2 className="text-lg font-semibold">Skill Radar</h2>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={radarData}
                    cx="50%"
                    cy="50%"
                    outerRadius="65%"
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
                      name="You"
                      dataKey="you"
                      stroke="#32634b"
                      strokeWidth={2}
                      fill="#32634b"
                      fillOpacity={0.15}
                      dot={{ r: 3, fill: "#32634b" }}
                    />
                    <Radar
                      name="Learning target"
                      dataKey="benchmark"
                      stroke="#3f617e"
                      strokeWidth={1.5}
                      fill="#3f617e"
                      fillOpacity={0.06}
                      dot={false}
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
              </div>
            </CardContent>
          </Card>

          {trendData && trendData.rows.length > 0 ? (
            <Card>
              <CardHeader className="p-5 pb-0">
                <h2 className="text-lg font-semibold">Score Trends</h2>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData.rows}
                      margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e9e0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#697168", fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#697168", fontSize: 9 }}
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
                      />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      {trendData.skillNames.map((name: string, i: number) => (
                        <Line
                          key={name}
                          type="monotone"
                          dataKey={name}
                          stroke={LINE_COLORS[i % LINE_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent
                className="p-5 flex items-center justify-center text-sm text-muted"
                style={{ height: 220 }}
              >
                Take daily tests to see score trends
              </CardContent>
            </Card>
          )}
        </div>
  );
}
