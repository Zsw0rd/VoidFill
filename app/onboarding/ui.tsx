"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

import { CareerPicker, type AvailableSkill, type CareerChoice } from "@/components/careers/CareerPicker";
import { PERSONAL_GOAL_NAME } from "@/lib/careerCatalog";

type Role = { id: string; name: string; description: string | null };

export function OnboardingForm({ roles, skills }: { roles: Role[]; skills: AvailableSkill[] }) {
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1
  const [userType, setUserType] = useState<"student" | "professional">(
    "student",
  );

  // Step 2: Student
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [educationLevel, setEducationLevel] = useState("");

  // Step 2: Professional
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Step 3
  const [career, setCareer] = useState<CareerChoice>({roleId: "", goal: "", level: "foundation", focusIds: [], context: ""});
  const [futurePlans, setFuturePlans] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [currentSkillsText, setCurrentSkillsText] = useState("");

  const [busy, setBusy] = useState(false);
  const saving = useRef(false);

  function validateStep2(): boolean {
    if (yearsExperience && (!Number.isFinite(Number(yearsExperience)) || Number(yearsExperience) < 0 || Number(yearsExperience) > 80)) {
      toast("Check your experience", "Enter a number from 0 to 80, or leave it blank.");
      return false;
    }
    if (graduationYear && (!Number.isInteger(Number(graduationYear)) || Number(graduationYear) < 1900 || Number(graduationYear) > 2200)) {
      toast("Check your graduation year", "Enter a four-digit year, or leave it blank.");
      return false;
    }
    if (cgpa && (!Number.isFinite(Number(cgpa)) || Number(cgpa) < 0)) {
      toast("Check your academic result", "Enter a positive number, or leave it blank.");
      return false;
    }
    return true;
  }

  function validateStep3(): boolean {
    if (!roles.some(role => role.id === career.roleId)) {
      toast("Choose a career", "Choose a career profile or build a personal goal from focus skills.");
      return false;
    }
    if (roles.find(role => role.id === career.roleId)?.name === PERSONAL_GOAL_NAME && (!career.goal.trim() || !career.focusIds.length)) {
      toast("Complete your personal goal", "Give it a name and choose at least one focus skill.");
      return false;
    }
    return true;
  }

  function nextStep() {
    if (step === 2 && !validateStep2()) return;
    if (step < totalSteps) setStep(step + 1);
  }

  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  async function save() {
    if (saving.current || !validateStep3()) return;
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

      const profileUpdate: any = {
        user_type: userType,
        target_role_id: career.roleId,
        custom_target_role: career.goal.trim() || null,
        career_level: career.level,
        career_focus_skill_ids: career.focusIds,
        career_goal_context: career.context.trim(),
        future_plans: futurePlans,
        strengths,
        weaknesses,
        current_skills_text: currentSkillsText,
        onboarded: true,
      };

      if (userType === "student") {
        profileUpdate.previous_academics = {
          college: college || null,
          cgpa: cgpa ? Number(cgpa) : null,
        };
        profileUpdate.course = course;
        profileUpdate.education_level = educationLevel;
        profileUpdate.graduation_year = graduationYear
          ? Number(graduationYear)
          : null;
      } else {
        profileUpdate.company = company;
        profileUpdate.job_title = jobTitle;
        profileUpdate.years_experience = yearsExperience
          ? Number(yearsExperience)
          : null;
        profileUpdate.linkedin_url = linkedinUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user.id);
      setBusy(false);
      if (error) return toast("Save failed", error.message);
      toast("Profile complete!", "Your personalized journey starts now.");
      window.location.assign("/dashboard");
    } catch {
      toast(
        "Save failed",
        "Check your connection and try again. Your details are still here.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <p className="eyebrow mb-3">Before we begin</p>
      <h1 className="page-title">Make this space yours.</h1>
      <p className="page-description mb-7">
        A few details help us point you in the right direction.
      </p>
      <Card>
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                {step === 1
                  ? "Where are you starting from?"
                  : step === 2
                    ? "A little about your background."
                    : "What would you like to grow toward?"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Step {step} of {totalSteps} —{" "}
                {step === 1
                  ? "Tell us about you"
                  : step === 2
                    ? "Your background"
                    : "Goals & skills"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[...Array(totalSteps)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${i < step ? "w-8 bg-emerald-400" : "w-2 bg-paper-soft"}`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ol
            className="mb-7 grid grid-cols-3 gap-2 border-b border-line pb-5"
            aria-label="Setup progress"
          >
            {["Your starting point", "Your background", "Your direction"].map(
              (label, i) => (
                <li
                  key={label}
                  aria-current={step === i + 1 ? "step" : undefined}
                  className={`flex gap-2 items-center text-[10px] ${step >= i + 1 ? "font-semibold text-forest" : "text-muted"}`}
                >
                  <span
                    className={`h-6 w-6 rounded-full flex items-center justify-center border ${step >= i + 1 ? "bg-forest text-white border-forest" : "border-line"}`}
                  >
                    {i + 1}
                  </span>
                  <span>{label}</span>
                </li>
              ),
            )}
          </ol>
          <AnimatePresence mode="wait">
            {/* Step 1: Student or Professional */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <Label className="text-base">I am a...</Label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    aria-pressed={userType === "student"}
                    onClick={() => setUserType("student")}
                    className={[
                      "flex items-start gap-4 text-left rounded-2xl border p-5 transition",
                      userType === "student"
                        ? "border-emerald-400/40 bg-emerald-500/10"
                        : "border-line bg-paper-soft hover:bg-paper-soft",
                    ].join(" ")}
                  >
                    <div
                      className={`rounded-xl p-3 ${userType === "student" ? "bg-emerald-500/20" : "bg-paper-soft"}`}
                    >
                      <GraduationCap className="w-6 h-6 text-forest" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Student</div>
                      <div className="mt-1 text-sm text-muted">
                        Currently studying or recently graduated
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-pressed={userType === "professional"}
                    onClick={() => setUserType("professional")}
                    className={[
                      "flex items-start gap-4 text-left rounded-2xl border p-5 transition",
                      userType === "professional"
                        ? "border-blue-400/40 bg-blue-500/10"
                        : "border-line bg-paper-soft hover:bg-paper-soft",
                    ].join(" ")}
                  >
                    <div
                      className={`rounded-xl p-3 ${userType === "professional" ? "bg-blue-500/20" : "bg-paper-soft"}`}
                    >
                      <Briefcase className="w-6 h-6 text-sky" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Professional</div>
                      <div className="mt-1 text-sm text-muted">
                        Working or transitioning careers
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Background */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <p className="text-sm text-muted leading-6">Background details are optional. You can add them in your profile later; they do not award skill scores.</p>
                {userType === "student" ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="field-college-university">
                          College / University (optional)
                        </Label>
                        <Input
                          id="field-college-university"
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                          placeholder="e.g. Stanford University"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="field-course-major">
                          Course / Major (optional)
                        </Label>
                        <Input
                          id="field-course-major"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          placeholder="e.g. B.Tech Computer Science"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="field-education-level">
                          Education Level (optional)
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
                        <Label htmlFor="field-cgpa-optional">
                          CGPA (optional)
                        </Label>
                        <Input
                          id="field-cgpa-optional"
                          value={cgpa}
                          onChange={(e) => setCgpa(e.target.value)}
                          placeholder="8.2"
                          type="number"
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="field-graduation-year">
                          Graduation Year (optional)
                        </Label>
                        <Input
                          id="field-graduation-year"
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(e.target.value)}
                          placeholder="2026"
                          type="number"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="field-company">Company (optional)</Label>
                        <Input
                          id="field-company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Google"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="field-job-title">Job Title (optional)</Label>
                        <Input
                          id="field-job-title"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Software Engineer"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="field-years-of-experience">
                          Years of Experience (optional)
                        </Label>
                        <Input
                          id="field-years-of-experience"
                          value={yearsExperience}
                          onChange={(e) => setYearsExperience(e.target.value)}
                          placeholder="3"
                          type="number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="field-linkedin-url-optional">
                          LinkedIn URL (optional)
                        </Label>
                        <Input
                          id="field-linkedin-url-optional"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="https://linkedin.com/in/you"
                        />
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 3: Target Role & Skills */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <CareerPicker roles={roles} skills={skills} value={career} onChange={setCareer} disabled={busy} />

                <details className="rounded-xl border border-line p-4"><summary className="cursor-pointer text-sm font-semibold py-2">Add learning context (optional)</summary><div className="space-y-5 mt-4">

                <div className="space-y-2">
                  <Label htmlFor="field-current-skills">Current Skills (optional)</Label>
                  <Textarea
                    id="field-current-skills"
                    value={currentSkillsText}
                    onChange={(e) => setCurrentSkillsText(e.target.value)}
                    placeholder="e.g. Excel, customer communication, bookkeeping, Python..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-strengths">Strengths (optional)</Label>
                    <Textarea
                      id="field-strengths"
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder="e.g. clear communication, analysis, problem solving..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field-weaknesses">Areas to improve (optional)</Label>
                    <Textarea
                      id="field-weaknesses"
                      value={weaknesses}
                      onChange={(e) => setWeaknesses(e.target.value)}
                      placeholder="e.g. presenting ideas, spreadsheet formulas, testing..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field-future-plans-optional">
                    Future Plans (optional)
                  </Label>
                  <Textarea
                    id="field-future-plans-optional"
                    value={futurePlans}
                    onChange={(e) => setFuturePlans(e.target.value)}
                    placeholder="e.g. Move into customer success, lead projects, or build software..."
                  />
                </div>

                </div></details>

                <div className="rounded-2xl border border-line bg-gradient-to-br from-emerald-500/5 to-paper p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-forest" />
                    <div className="font-semibold">What happens next?</div>
                  </div>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    Your workspace will bring together assessments, skill
                    insights, and a learning roadmap for your selected role.
                    Start with a baseline assessment to measure your current
                    skills.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <Button variant="ghost" onClick={prevStep} disabled={busy}>
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <div />
            )}
            {step < totalSteps ? (
              <Button onClick={nextStep}>
                {step === 2 ? "Continue to my direction" : "Next"} <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button disabled={busy} onClick={save}>
                {busy ? "Saving..." : "Finish setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
