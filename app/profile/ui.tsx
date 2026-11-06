"use client";

import { useState, useMemo, useRef } from "react";
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

import { CareerPicker, type AvailableSkill, type CareerChoice } from "@/components/careers/CareerPicker";
import { PERSONAL_GOAL_NAME } from "@/lib/careerCatalog";

const LINE_COLORS = [
  "#32634b",
  "#3f617e",
  "#bd482c",
  "#a855f7",
  "#ec4899",
  "#a4832e",
  "#14b8a6",
];

interface Props {
  initial: any;
  roles: { id: string; name: string }[];
  skills: AvailableSkill[];
  userId: string;
  roleSkills: any[];
  userScores: any[];
  stats: any;
  attemptHistory: any[];
}

export function ProfileEditor({
  initial,
  roles,
  skills,
  userId,
  roleSkills,
  userScores,
  stats,
  attemptHistory,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);

  const isStudent = initial.user_type === "student" || !initial.user_type;
  const roleName =
    initial.custom_target_role ||
    initial.roles?.name ||
    "Choose a learning track";

  const initialCareer: CareerChoice = {roleId: initial.target_role_id || "", goal: initial.custom_target_role || "", level: initial.career_level === "intermediate" ? "intermediate" : "foundation", focusIds: initial.career_focus_skill_ids || [], context: initial.career_goal_context || ""};
  const [career, setCareer] = useState<CareerChoice>(initialCareer);

  const [fullName, setFullName] = useState(initial.full_name || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [course, setCourse] = useState(initial.course || "");
  const [futurePlans, setFuturePlans] = useState(initial.future_plans || "");
  const [strengths, setStrengths] = useState(initial.strengths || "");
  const [weaknesses, setWeaknesses] = useState(initial.weaknesses || "");
  const [currentSkillsText, setCurrentSkillsText] = useState(
    initial.current_skills_text || "",
  );
  const [college, setCollege] = useState(
    initial.previous_academics?.college || "",
  );
  const [cgpa, setCgpa] = useState(
    initial.previous_academics?.cgpa?.toString() || "",
  );
  const [educationLevel, setEducationLevel] = useState(
    initial.education_level || "",
  );
  const [graduationYear, setGraduationYear] = useState(
    initial.graduation_year?.toString() || "",
  );
  const [company, setCompany] = useState(initial.company || "");
  const [jobTitle, setJobTitle] = useState(initial.job_title || "");
  const [yearsExperience, setYearsExperience] = useState(
    initial.years_experience?.toString() || "",
  );
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedin_url || "");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);

  function toggleEdit() {
    if (editMode) {
      setFullName(initial.full_name || "");
      setPhone(initial.phone || "");
      setCourse(initial.course || "");
      setFuturePlans(initial.future_plans || "");
      setStrengths(initial.strengths || "");
      setWeaknesses(initial.weaknesses || "");
      setCurrentSkillsText(initial.current_skills_text || "");
      setCollege(initial.previous_academics?.college || "");
      setCgpa(initial.previous_academics?.cgpa?.toString() || "");
      setEducationLevel(initial.education_level || "");
      setGraduationYear(initial.graduation_year?.toString() || "");
      setCompany(initial.company || "");
      setJobTitle(initial.job_title || "");
      setYearsExperience(initial.years_experience?.toString() || "");
      setLinkedinUrl(initial.linkedin_url || "");
      setCareer(initialCareer);
    }
    setEditMode(!editMode);
  }

  // Radar data
  const radarData = useMemo(() => {
    const scoreMap = new Map<string, number>();
    userScores.forEach((s: any) =>
      scoreMap.set(s.skill_id, Number(s.score ?? 0)),
    );
    return roleSkills.map((rs: any) => ({
      skill: rs.skills?.name ?? "?",
      you: scoreMap.get(rs.skill_id) ?? null,
      benchmark: rs.target ?? 75,
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
    if (saving.current) return;
    if (!roles.some((role) => role.id === career.roleId)) {
      return toast(
        "Choose a learning track",
        "Select the foundation for your assessments and learning resources.",
      );
    }
    if (roles.find(role => role.id === career.roleId)?.name === PERSONAL_GOAL_NAME && (!career.goal.trim() || !career.focusIds.length)) return toast("Complete your personal goal", "Name your goal and choose at least one focus skill.");
    saving.current = true;
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setBusy(false);
        return toast("Not logged in", "Please login again.");
      }

      const update: any = {
        full_name: fullName,
        phone,
        course,
        future_plans: futurePlans,
        strengths,
        weaknesses,
        current_skills_text: currentSkillsText,
        target_role_id: career.roleId,
        custom_target_role: career.goal.trim() || null,
        career_level: career.level,
        career_focus_skill_ids: career.focusIds,
        career_goal_context: career.context.trim(),
      };

      if (isStudent) {
        update.previous_academics = {
          college,
          cgpa: cgpa ? Number(cgpa) : null,
        };
        update.education_level = educationLevel;
        update.graduation_year = graduationYear ? Number(graduationYear) : null;
      } else {
        update.company = company;
        update.job_title = jobTitle;
        update.years_experience = yearsExperience
          ? Number(yearsExperience)
          : null;
        update.linkedin_url = linkedinUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update(update)
        .eq("id", user.id);
      setBusy(false);
      if (error) return toast("Save failed", error.message);
      toast("Saved", "Profile updated.");
      setEditMode(false);
      router.refresh();
    } catch {
      toast(
        "Save failed",
        "Check your connection and try again. Your edits are still here.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
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
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      {/* ═══════════ Overview Section ═══════════ */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl font-bold text-forest shrink-0">
              {(fullName || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="!text-2xl font-semibold">
                {fullName || "Learner"}
              </h2>
              <div className="mt-1 text-sm text-muted">
                {roleName} · {course || "N/A"}
              </div>
              {initial.custom_target_role && initial.roles?.name && (
                <p className="mt-1 text-xs text-muted">
                  Learning track: {initial.roles.name}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <code className="max-w-[200px] sm:max-w-none truncate text-[11px] text-muted bg-paper-soft px-2 py-1 rounded-lg font-mono">
                  {userId}
                </code>
                <button
                  onClick={copyUUID}
                  className="text-muted hover:text-muted transition"
                  title="Copy UUID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={isStudent ? "good" : "warn"}>
                {isStudent ? "Student" : "Professional"}
              </Badge>
            </div>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-paper-soft border border-line p-3 text-center">
                <div className="text-xl font-bold text-forest">
                  {stats.level}
                </div>
                <div className="text-[10px] text-muted uppercase tracking-wider">
                  Level
                </div>
              </div>
              <div className="rounded-xl bg-paper-soft border border-line p-3 text-center">
                <div className="text-xl font-bold text-sky">{stats.xp}</div>
                <div className="text-[10px] text-muted uppercase tracking-wider">
                  XP
                </div>
              </div>
              <div className="rounded-xl bg-paper-soft border border-line p-3 text-center">
                <div className="text-xl font-bold text-rust">
                  {stats.streak} days
                </div>
                <div className="text-[10px] text-muted uppercase tracking-wider">
                  Streak
                </div>
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
                <div className="text-xs text-muted w-28 truncate">
                  {s.skills?.name}
                </div>
                <Progress value={s.score} className="flex-1 h-2" />
                <div className="text-xs font-medium w-10 text-right">
                  {s.score}%
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ═══════════ Profile details Section ═══════════ */}
      <Card>
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-muted" />
              Profile details
            </h2>
            <Button
              variant="soft"
              onClick={toggleEdit}
              disabled={busy}
              className="text-xs"
            >
              {editMode ? "Cancel" : "Edit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!editMode ? (
            <dl className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  label: isStudent ? "Education" : "Current role",
                  value: isStudent
                    ? [course, college].filter(Boolean).join(" · ")
                    : [jobTitle, company].filter(Boolean).join(" · "),
                },
                { label: "Current skills", value: currentSkillsText },
                { label: "Strengths", value: strengths },
                { label: "Growth areas", value: weaknesses },
                { label: "Looking ahead", value: futurePlans },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="eyebrow">{item.label}</dt>
                  <dd className="mt-2 text-xs leading-6 text-muted whitespace-pre-wrap">
                    {item.value || "Add this to make your profile more useful."}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field-full-name">Full name</Label>
                  <Input
                    id="field-full-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-phone">Phone</Label>
                  <Input
                    id="field-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {isStudent && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="field-college">College</Label>
                      <Input
                        id="field-college"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="field-course">Course</Label>
                      <Input
                        id="field-course"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="field-education-level">
                        Education Level
                      </Label>
                      <select
                        id="field-education-level"
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        className="w-full rounded-2xl border border-line bg-paper-soft text-ink px-4 py-3 text-sm outline-none focus:border-emerald-500/50"
                        style={{ colorScheme: "light" }}
                      >
                        <option value="">Select</option>
                        <option value="high_school">High School</option>
                        <option value="undergraduate">Undergraduate</option>
                        <option value="postgraduate">Postgraduate</option>
                        <option value="phd">PhD</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="field-cgpa">CGPA</Label>
                      <Input
                        id="field-cgpa"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        type="number"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="field-graduation-year">
                        Graduation Year
                      </Label>
                      <Input
                        id="field-graduation-year"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        type="number"
                      />
                    </div>
                  </div>
                </>
              )}

              {!isStudent && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-company">Company</Label>
                    <Input
                      id="field-company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field-job-title">Job Title</Label>
                    <Input
                      id="field-job-title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field-years-of-experience">
                      Years of Experience
                    </Label>
                    <Input
                      id="field-years-of-experience"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      type="number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field-linkedin-url">LinkedIn URL</Label>
                    <Input
                      id="field-linkedin-url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/you"
                    />
                  </div>
                </div>
              )}

              <CareerPicker roles={roles} skills={skills} value={career} onChange={setCareer} disabled={busy} />
              <div className="space-y-2">
                <Label htmlFor="field-current-skills">Current Skills</Label>
                <Textarea
                  id="field-current-skills"
                  value={currentSkillsText}
                  onChange={(e) => setCurrentSkillsText(e.target.value)}
                  placeholder="e.g. Excel, communication, recruitment, Python..."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field-strengths">Strengths</Label>
                  <Textarea
                    id="field-strengths"
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-weaknesses">Weaknesses</Label>
                  <Textarea
                    id="field-weaknesses"
                    value={weaknesses}
                    onChange={(e) => setWeaknesses(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-future-plans">Future plans</Label>
                <Textarea
                  id="field-future-plans"
                  value={futurePlans}
                  onChange={(e) => setFuturePlans(e.target.value)}
                />
              </div>

              {editMode && (
                <Button disabled={busy} onClick={save} className="w-full">
                  {busy ? "Saving..." : "Save changes"}
                </Button>
              )}
            </fieldset>
          )}
        </CardContent>
      </Card>

      {/* ═══════════ Logout ═══════════ */}
      <Card className="bg-paper-soft">
        <CardContent className="p-4">
          <Button variant="soft" onClick={logout} className="w-full gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
