"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { Input } from "@/components/ui/input";
import { GraduationCap, Briefcase, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

type Role = { id: string; name: string; description: string | null };

export function OnboardingForm({ roles }: { roles: Role[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1
  const [userType, setUserType] = useState<"student" | "professional">("student");

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

  function validateStep2(): boolean {
    if (userType === "student") {
      if (!college.trim()) { toast("Required", "College / University is required."); return false; }
      if (!course.trim()) { toast("Required", "Course / Major is required."); return false; }
      if (!educationLevel) { toast("Required", "Education Level is required."); return false; }
      if (!graduationYear.trim()) { toast("Required", "Graduation Year is required."); return false; }
    } else {
      if (!company.trim()) { toast("Required", "Company is required."); return false; }
      if (!jobTitle.trim()) { toast("Required", "Job Title is required."); return false; }
      if (!yearsExperience.trim()) { toast("Required", "Years of Experience is required."); return false; }
    }
    return true;
  }

  function validateStep3(): boolean {
    if (useCustomRole && !customRoleText.trim()) {
      toast("Required", "Please enter your custom target role."); return false;
    }
    if (!useCustomRole && !targetRoleId) {
      toast("Required", "Please select a target role."); return false;
    }
    if (!currentSkillsText.trim()) { toast("Required", "Current Skills is required."); return false; }
    if (!strengths.trim()) { toast("Required", "Strengths is required."); return false; }
    if (!weaknesses.trim()) { toast("Required", "Weaknesses is required."); return false; }
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
    if (!validateStep3()) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return toast("Not logged in", "Please login again."); }

    const profileUpdate: any = {
      user_type: userType,
      target_role_id: useCustomRole ? null : (targetRoleId || null),
      custom_target_role: useCustomRole ? customRoleText.trim() : null,
      future_plans: futurePlans,
      strengths,
      weaknesses,
      current_skills_text: currentSkillsText,
      onboarded: true,
    };

    if (userType === "student") {
      profileUpdate.previous_academics = { college: college || null, cgpa: cgpa ? Number(cgpa) : null };
      profileUpdate.course = course;
      profileUpdate.education_level = educationLevel;
      profileUpdate.graduation_year = graduationYear ? Number(graduationYear) : null;
    } else {
      profileUpdate.company = company;
      profileUpdate.job_title = jobTitle;
      profileUpdate.years_experience = yearsExperience ? Number(yearsExperience) : null;
      profileUpdate.linkedin_url = linkedinUrl;
    }

    const { error } = await supabase.from("profiles").update(profileUpdate).eq("id", user.id);
    setBusy(false);
    if (error) return toast("Save failed", error.message);
    toast("Profile complete!", "Your personalized journey starts now.");
    router.push("/dashboard");
  }

  const slideVariants = { enter: { opacity: 0, x: 30 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 } };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card>
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Let&apos;s get you set up</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Step {step} of {totalSteps} — {step === 1 ? "Tell us about you" : step === 2 ? "Your background" : "Goals & skills"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[...Array(totalSteps)].map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all ${i < step ? "w-8 bg-emerald-400" : "w-2 bg-white/10"}`} />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Student or Professional */}
            {step === 1 && (
              <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-5">
                <Label className="text-base">I am a...</Label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button type="button" onClick={() => setUserType("student")}
                    className={["flex items-start gap-4 text-left rounded-2xl border p-5 transition", userType === "student" ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")}>
                    <div className={`rounded-xl p-3 ${userType === "student" ? "bg-emerald-500/20" : "bg-white/5"}`}><GraduationCap className="w-6 h-6 text-emerald-300" /></div>
                    <div><div className="font-semibold text-lg">Student</div><div className="mt-1 text-sm text-zinc-400">Currently studying or recently graduated</div></div>
                  </button>
                  <button type="button" onClick={() => setUserType("professional")}
                    className={["flex items-start gap-4 text-left rounded-2xl border p-5 transition", userType === "professional" ? "border-blue-400/40 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")}>
                    <div className={`rounded-xl p-3 ${userType === "professional" ? "bg-blue-500/20" : "bg-white/5"}`}><Briefcase className="w-6 h-6 text-blue-300" /></div>
                    <div><div className="font-semibold text-lg">Professional</div><div className="mt-1 text-sm text-zinc-400">Working or transitioning careers</div></div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Background */}
            {step === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-5">
                {userType === "student" ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>College / University *</Label><Input value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. Stanford University" /></div>
                      <div className="space-y-2"><Label>Course / Major *</Label><Input value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. B.Tech Computer Science" /></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>Education Level *</Label>
                        <select value={educationLevel} onChange={e => setEducationLevel(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-emerald-500/50">
                          <option value="">Select</option><option value="high_school">High School</option><option value="undergraduate">Undergraduate</option><option value="postgraduate">Postgraduate</option><option value="phd">PhD</option>
                        </select>
                      </div>
                      <div className="space-y-2"><Label>CGPA (optional)</Label><Input value={cgpa} onChange={e => setCgpa(e.target.value)} placeholder="8.2" type="number" step="0.1" /></div>
                      <div className="space-y-2"><Label>Graduation Year *</Label><Input value={graduationYear} onChange={e => setGraduationYear(e.target.value)} placeholder="2026" type="number" /></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Company *</Label><Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" /></div>
                      <div className="space-y-2"><Label>Job Title *</Label><Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer" /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Years of Experience *</Label><Input value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} placeholder="3" type="number" /></div>
                      <div className="space-y-2"><Label>LinkedIn URL (optional)</Label><Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/you" /></div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 3: Target Role & Skills */}
            {step === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-5">
                <div className="space-y-2">
                  <Label>Target Role *</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {roles.map(r => (
                      <button key={r.id} type="button" onClick={() => { setTargetRoleId(r.id); setUseCustomRole(false); }}
                        className={["text-left rounded-2xl border p-4 transition", !useCustomRole && r.id === targetRoleId ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")}>
                        <div className="font-semibold">{r.name}</div>
                        <div className="mt-1 text-sm text-zinc-400">{r.description || "Role track"}</div>
                      </button>
                    ))}
                    <button type="button" onClick={() => { setUseCustomRole(true); setTargetRoleId(""); }}
                      className={["text-left rounded-2xl border p-4 transition", useCustomRole ? "border-purple-400/40 bg-purple-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")}>
                      <div className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-300" /> Others / Custom</div>
                      <div className="mt-1 text-sm text-zinc-400">Enter your own target role</div>
                    </button>
                  </div>
                  {useCustomRole && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                      <Input value={customRoleText} onChange={e => setCustomRoleText(e.target.value)} placeholder="e.g. AI/ML Engineer, DevOps Specialist, Product Manager..." className="border-purple-500/20 focus:border-purple-500/40" />
                      <p className="mt-1 text-xs text-zinc-500">AI will generate a personalized roadmap and skills for this role</p>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2"><Label>Current Skills *</Label><Textarea value={currentSkillsText} onChange={e => setCurrentSkillsText(e.target.value)} placeholder="e.g. Python (intermediate), React (beginner), SQL (advanced)..." /></div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Strengths *</Label><Textarea value={strengths} onChange={e => setStrengths(e.target.value)} placeholder="e.g. problem solving, system design..." /></div>
                  <div className="space-y-2"><Label>Weaknesses *</Label><Textarea value={weaknesses} onChange={e => setWeaknesses(e.target.value)} placeholder="e.g. DSA depth, frontend styling..." /></div>
                </div>

                <div className="space-y-2"><Label>Future Plans (optional)</Label><Textarea value={futurePlans} onChange={e => setFuturePlans(e.target.value)} placeholder="e.g. Want to transition to ML engineering, preparing for FAANG..." /></div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/5 to-zinc-900/50 p-5">
                  <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-300" /><div className="font-semibold">What happens next?</div></div>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                    Our AI will analyze your profile and skills to create a personalized learning roadmap with courses, assessments, and recommendations tailored to your target role.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (<Button variant="ghost" onClick={prevStep}><ChevronLeft className="w-4 h-4" /> Back</Button>) : <div />}
            {step < totalSteps ? (
              <Button onClick={nextStep}>Next <ChevronRight className="w-4 h-4" /></Button>
            ) : (
              <Button disabled={busy} onClick={save}>{busy ? "Saving..." : "Finish setup"}</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
