"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogOut, User, Pencil, Copy } from "lucide-react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

const LINE_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#ec4899", "#eab308", "#14b8a6"];

interface Props {
  initial: any;
  userId: string;
  roleSkills: any[];
  userScores: any[];
  stats: any;
  attemptHistory: any[];
}

export function ProfileEditor({ initial, userId, roleSkills, userScores, stats, attemptHistory }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);

  const isStudent = initial.user_type === "student" || !initial.user_type;
  const roleName = initial.roles?.name || "No role selected";

  const [fullName, setFullName] = useState(initial.full_name || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [course, setCourse] = useState(initial.course || "");
  const [futurePlans, setFuturePlans] = useState(initial.future_plans || "");
  const [strengths, setStrengths] = useState(initial.strengths || "");
  const [weaknesses, setWeaknesses] = useState(initial.weaknesses || "");
  const [currentSkillsText, setCurrentSkillsText] = useState(initial.current_skills_text || "");
  const [college, setCollege] = useState(initial.previous_academics?.college || "");
  const [cgpa, setCgpa] = useState(initial.previous_academics?.cgpa?.toString() || "");
  const [educationLevel, setEducationLevel] = useState(initial.education_level || "");
  const [graduationYear, setGraduationYear] = useState(initial.graduation_year?.toString() || "");
  const [company, setCompany] = useState(initial.company || "");
  const [jobTitle, setJobTitle] = useState(initial.job_title || "");
  const [yearsExperience, setYearsExperience] = useState(initial.years_experience?.toString() || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedin_url || "");
  const [busy, setBusy] = useState(false);

  // Radar data
  const radarData = useMemo(() => {
    const scoreMap = new Map<string, number>();
    userScores.forEach((s: any) => scoreMap.set(s.skill_id, Number(s.score ?? 0)));
    return roleSkills.map((rs: any) => ({
      skill: rs.skills?.name ?? "?",
      you: scoreMap.get(rs.skill_id) ?? 0,
      benchmark: Math.round(Number(rs.weight ?? 0.8) * 100),
    }));
  }, [roleSkills, userScores]);

  // Trend data
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

  async function save() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return toast("Not logged in", "Please login again."); }

    const update: any = {
      full_name: fullName, phone, course,
      future_plans: futurePlans, strengths, weaknesses,
      current_skills_text: currentSkillsText,
    };

    if (isStudent) {
      update.previous_academics = { college, cgpa: cgpa ? Number(cgpa) : null };
      update.education_level = educationLevel;
      update.graduation_year = graduationYear ? Number(graduationYear) : null;
    } else {
      update.company = company;
      update.job_title = jobTitle;
      update.years_experience = yearsExperience ? Number(yearsExperience) : null;
      update.linkedin_url = linkedinUrl;
    }

    const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
    setBusy(false);
    if (error) return toast("Save failed", error.message);
    toast("Saved", "Profile updated.");
    setEditMode(false);
    router.refresh();
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) return toast("Logout failed", error.message);
    window.location.href = "/";
  }

  function copyUUID() {
    navigator.clipboard.writeText(userId);
    toast("Copied", "User ID copied to clipboard");
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-4">
      {/* ═══════════ Overview Section ═══════════ */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl font-bold text-emerald-300 shrink-0">
              {(fullName || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold">{fullName || "Unknown"}</h1>
              <div className="mt-1 text-sm text-zinc-400">{roleName} · {course || "N/A"}</div>
              <div className="mt-2 flex items-center gap-2">
                <code className="text-[11px] text-zinc-500 bg-white/5 px-2 py-1 rounded-lg font-mono">{userId}</code>
                <button onClick={copyUUID} className="text-zinc-500 hover:text-zinc-300 transition" title="Copy UUID">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={isStudent ? "good" : "warn"}>{isStudent ? "Student" : "Professional"}</Badge>
            </div>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                <div className="text-xl font-bold text-emerald-400">{stats.level}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Level</div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                <div className="text-xl font-bold text-indigo-400">{stats.xp}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">XP</div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                <div className="text-xl font-bold text-orange-400">{stats.streak}🔥</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Streak</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════ Skill Radar & Score Trends ═══════════ */}
      {radarData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-5 pb-0">
              <h2 className="text-lg font-semibold">Skill Radar</h2>
            </CardHeader>
            <CardContent className="p-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#ffffff10" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 9 }} />
                  <Radar name="You" dataKey="you" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
                  <Radar name="Benchmark" dataKey="benchmark" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {trendData && trendData.rows.length > 0 ? (
            <Card>
              <CardHeader className="p-5 pb-0">
                <h2 className="text-lg font-semibold">Score Trends</h2>
              </CardHeader>
              <CardContent className="p-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData.rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 12 }} />
                    <Legend />
                    {trendData.skillNames.map((name: string, i: number) => (
                      <Line key={name} type="monotone" dataKey={name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-5 flex items-center justify-center h-[280px] text-sm text-zinc-500">
                Take daily tests to see score trends
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════ Skill Scores List ═══════════ */}
      {userScores.length > 0 && (
        <Card>
          <CardHeader className="p-5 pb-2">
            <h2 className="text-lg font-semibold">Skill Scores</h2>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2">
            {userScores.map((s: any) => (
              <div key={s.skill_id} className="flex items-center gap-3">
                <div className="text-xs text-zinc-400 w-28 truncate">{s.skills?.name}</div>
                <Progress value={s.score} className="flex-1 h-2" />
                <div className="text-xs font-medium w-10 text-right">{s.score}%</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ═══════════ Edit Profile Section ═══════════ */}
      <Card>
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-zinc-400" />
              Edit Profile
            </h2>
            <Button variant="soft" onClick={() => setEditMode(!editMode)} className="text-xs">
              {editMode ? "Cancel" : "Edit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`p-6 space-y-5 ${!editMode ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          {isStudent && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>College</Label>
                  <Input value={college} onChange={(e) => setCollege(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Input value={course} onChange={(e) => setCourse(e.target.value)} />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Education Level</Label>
                  <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-emerald-500/50">
                    <option value="">Select</option>
                    <option value="high_school">High School</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                    <option value="phd">PhD</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>CGPA</Label>
                  <Input value={cgpa} onChange={(e) => setCgpa(e.target.value)} type="number" step="0.1" />
                </div>
                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} type="number" />
                </div>
              </div>
            </>
          )}

          {!isStudent && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Input value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/you" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Current Skills</Label>
            <Textarea value={currentSkillsText} onChange={(e) => setCurrentSkillsText(e.target.value)} placeholder="e.g. Python (intermediate), React (beginner)..." />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Strengths</Label>
              <Textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Weaknesses</Label>
              <Textarea value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Future plans</Label>
            <Textarea value={futurePlans} onChange={(e) => setFuturePlans(e.target.value)} />
          </div>

          {editMode && (
            <Button disabled={busy} onClick={save} className="w-full">{busy ? "Saving..." : "Save changes"}</Button>
          )}
        </CardContent>
      </Card>

      {/* ═══════════ Logout ═══════════ */}
      <Card className="bg-white/5">
        <CardContent className="p-4">
          <Button variant="soft" onClick={logout} className="w-full gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
