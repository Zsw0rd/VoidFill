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

type Role = { id: string; name: string; description: string | null };

export function OnboardingForm({ roles }: { roles: Role[] }) {
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
  const [targetRoleId, setTargetRoleId] = useState(roles[0]?.id || "");
  const [useCustomRole, setUseCustomRole] = useState(false);
  const [customRoleText, setCustomRoleText] = useState("");
  const [futurePlans, setFuturePlans] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [currentSkillsText, setCurrentSkillsText] = useState("");

  const [busy, setBusy] = useState(false);
  const saving = useRef(false);

  function validateStep2(): boolean {
    if (userType === "student") {
      if (!college.trim()) {
        toast("Required", "College / University is required.");
        return false;
      }
      if (!course.trim()) {
        toast("Required", "Course / Major is required.");
        return false;
      }
      if (!educationLevel) {
        toast("Required", "Education Level is required.");
        return false;
      }
      if (!graduationYear.trim()) {
        toast("Required", "Graduation Year is required.");
        return false;
      }
    } else {
      if (!company.trim()) {
        toast("Required", "Company is required.");
        return false;
      }
      if (!jobTitle.trim()) {
        toast("Required", "Job Title is required.");
        return false;
      }
      if (!yearsExperience.trim()) {
        toast("Required", "Years of Experience is required.");
        return false;
      }
    }
    return true;
  }

  function validateStep3(): boolean {
    if (useCustomRole && !customRoleText.trim()) {
      toast("Required", "Please enter your custom target role.");
      return false;
    }
    if (!roles.some((role) => role.id === targetRoleId)) {
      toast(
        "Required",
        "Please choose a learning track for your assessments and resources.",
      );
      return false;
    }
    if (!currentSkillsText.trim()) {
      toast("Required", "Current Skills is required.");
      return false;
    }
    if (!strengths.trim()) {
      toast("Required", "Strengths is required.");
      return false;
    }
    if (!weaknesses.trim()) {
      toast("Required", "Weaknesses is required.");
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
        target_role_id: targetRoleId,
        custom_target_role: useCustomRole ? customRoleText.trim() : null,
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
                {userType === "student" ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="field-college-university">
                          College / University *
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
                          Course / Major *
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
                          Education Level *
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
                          Graduation Year *
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
                        <Label htmlFor="field-company">Company *</Label>
                        <Input
                          id="field-company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Google"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="field-job-title">Job Title *</Label>
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
                          Years of Experience *
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
                <div className="space-y-2">
                  <Label>Learning track *</Label>
                  <p className="text-sm text-muted">
                    Choose the closest foundation for your assessments and
                    resources. You can add a personal career goal below.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {roles.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setTargetRoleId(r.id);
                        }}
                        aria-pressed={r.id === targetRoleId}
                        className={[
                          "text-left rounded-2xl border p-4 transition",
                          r.id === targetRoleId
                            ? "border-emerald-400/40 bg-emerald-500/10"
                            : "border-line bg-paper-soft hover:bg-paper-soft",
                        ].join(" ")}
                      >
                        <div className="font-semibold">{r.name}</div>
                        <div className="mt-1 text-sm text-muted">
                          {r.description || "Role track"}
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomRole(!useCustomRole);
                      }}
                      aria-pressed={useCustomRole}
                      className={[
                        "text-left rounded-2xl border p-4 transition",
                        useCustomRole
                          ? "border-purple-400/40 bg-purple-500/10"
                          : "border-line bg-paper-soft hover:bg-paper-soft",
                      ].join(" ")}
                    >
                      <div className="font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky" /> Add a personal
                        career goal
                      </div>
                      <div className="mt-1 text-sm text-muted">
                        Keep your ambition alongside your chosen track
                      </div>
                    </button>
                  </div>
                  {useCustomRole && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3"
                    >
                      <Label htmlFor="custom-career-goal">
                        Personal career goal
                      </Label>
                      <Input
                        id="custom-career-goal"
                        value={customRoleText}
                        onChange={(e) => setCustomRoleText(e.target.value)}
                        placeholder="e.g. AI/ML Engineer, DevOps Specialist, Product Manager..."
                        className="border-purple-500/20 focus:border-purple-500/40"
                        maxLength={160}
                      />
                      <p className="mt-1 text-xs text-muted">
                        Your selected track supplies the skills we can assess.
                        This goal is saved with it and can be updated in your
                        profile.
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field-current-skills">Current Skills *</Label>
                  <Textarea
                    id="field-current-skills"
                    value={currentSkillsText}
                    onChange={(e) => setCurrentSkillsText(e.target.value)}
                    placeholder="e.g. Python (intermediate), React (beginner), SQL (advanced)..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-strengths">Strengths *</Label>
                    <Textarea
                      id="field-strengths"
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder="e.g. problem solving, system design..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field-weaknesses">Weaknesses *</Label>
                    <Textarea
                      id="field-weaknesses"
                      value={weaknesses}
                      onChange={(e) => setWeaknesses(e.target.value)}
                      placeholder="e.g. DSA depth, frontend styling..."
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
                    placeholder="e.g. Want to transition to ML engineering, preparing for FAANG..."
                  />
                </div>

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
                Next <ChevronRight className="w-4 h-4" />
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
