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
import { GraduationCap, Briefcase, ChevronRight, ChevronLeft, Upload, Sparkles } from "lucide-react";

type Role = { id: string; name: string; description: string | null };

export function OnboardingForm({ roles }: { roles: Role[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1: User type
  const [userType, setUserType] = useState<"student" | "professional">("student");

  // Step 2: Student fields
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [educationLevel, setEducationLevel] = useState("");

  // Step 2: Professional fields
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Step 3: Target role & skills
  const [targetRoleId, setTargetRoleId] = useState(roles[0]?.id || "");
  const [futurePlans, setFuturePlans] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [currentSkillsText, setCurrentSkillsText] = useState("");

  // Step 4: Resume upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [busy, setBusy] = useState(false);

  function nextStep() {
    if (step < totalSteps) setStep(step + 1);
  }
  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  async function save() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      return toast("Not logged in", "Please login again.");
    }

    let resumeUrl: string | null = null;

    // Upload resume if provided
    if (resumeFile) {
      setUploading(true);
      const ext = resumeFile.name.split(".").pop();
      const path = `resumes/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("uploads").upload(path, resumeFile, { upsert: true });
      setUploading(false);
      if (uploadError) {
        toast("Resume upload failed", uploadError.message);
      } else {
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
        resumeUrl = urlData.publicUrl;
      }
    }

    const profileUpdate: any = {
      user_type: userType,
      target_role_id: targetRoleId || null,
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
      profileUpdate.graduation_year = graduationYear ? Number(graduationYear) : null;
    } else {
      profileUpdate.company = company;
      profileUpdate.job_title = jobTitle;
      profileUpdate.years_experience = yearsExperience ? Number(yearsExperience) : null;
      profileUpdate.linkedin_url = linkedinUrl;
    }

    if (resumeUrl) profileUpdate.resume_url = resumeUrl;

    const { error } = await supabase.from("profiles").update(profileUpdate).eq("id", user.id);

    setBusy(false);
    if (error) return toast("Save failed", error.message);
    toast("Profile complete!", "Your personalized journey starts now.");
    router.push("/dashboard");
  }

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card>
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Let&apos;s get you set up</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Step {step} of {totalSteps} — {step === 1 ? "Tell us about you" : step === 2 ? "Your background" : step === 3 ? "Goals & skills" : "Almost done"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[...Array(totalSteps)].map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all ${i < step ? "w-8 bg-zinc-200" : "w-2 bg-white/10"}`} />
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
                  <button
                    type="button"
                    onClick={() => setUserType("student")}
                    className={[
                      "flex items-start gap-4 text-left rounded-2xl border p-5 transition",
                      userType === "student" ? "border-zinc-200/40 bg-zinc-100/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <div className={`rounded-xl p-3 ${userType === "student" ? "bg-zinc-100/20" : "bg-white/5"}`}>
                      <GraduationCap className="w-6 h-6 text-zinc-200" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Student</div>
                      <div className="mt-1 text-sm text-zinc-400">Currently studying or recently graduated</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("professional")}
                    className={[
                      "flex items-start gap-4 text-left rounded-2xl border p-5 transition",
                      userType === "professional" ? "border-zinc-400/40 bg-zinc-700/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <div className={`rounded-xl p-3 ${userType === "professional" ? "bg-zinc-700/20" : "bg-white/5"}`}>
                      <Briefcase className="w-6 h-6 text-zinc-300" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Professional</div>
                      <div className="mt-1 text-sm text-zinc-400">Working or transitioning careers</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Background Details */}
            {step === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-5">
                {userType === "student" ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>College / University</Label>
                        <Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. Stanford University" />
                      </div>
                      <div className="space-y-2">
                        <Label>Course / Major</Label>
                        <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. B.Tech Computer Science" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Education Level</Label>
                        <select
                          value={educationLevel}
                          onChange={(e) => setEducationLevel(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-zinc-100/50"
                        >
                          <option value="">Select</option>
                          <option value="high_school">High School</option>
                          <option value="undergraduate">Undergraduate</option>
                          <option value="postgraduate">Postgraduate</option>
                          <option value="phd">PhD</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>CGPA (optional)</Label>
                        <Input value={cgpa} onChange={(e) => setCgpa(e.target.value)} placeholder="8.2" type="number" step="0.1" />
                      </div>
                      <div className="space-y-2">
                        <Label>Graduation Year</Label>
                        <Input value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="2026" type="number" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google" />
                      </div>
                      <div className="space-y-2">
                        <Label>Job Title</Label>
                        <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Years of Experience</Label>
                        <Input value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="3" type="number" />
                      </div>
                      <div className="space-y-2">
                        <Label>LinkedIn URL (optional)</Label>
                        <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/you" />
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 3: Target Role & Skills */}
            {step === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-5">
                <div className="space-y-2">
                  <Label>Target Role</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {roles.map((r) => {
                      const active = r.id === targetRoleId;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setTargetRoleId(r.id)}
                          className={[
                            "text-left rounded-2xl border p-4 transition",
                            active ? "border-zinc-200/40 bg-zinc-100/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                          ].join(" ")}
                        >
                          <div className="font-semibold">{r.name}</div>
                          <div className="mt-1 text-sm text-zinc-400">{r.description || "Role track"}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current Skills</Label>
                  <Textarea value={currentSkillsText} onChange={(e) => setCurrentSkillsText(e.target.value)} placeholder="e.g. Python (intermediate), React (beginner), SQL (advanced)..." />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Strengths</Label>
                    <Textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="e.g. problem solving, system design..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Weaknesses</Label>
                    <Textarea value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} placeholder="e.g. DSA depth, frontend styling..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Future Plans</Label>
                  <Textarea value={futurePlans} onChange={(e) => setFuturePlans(e.target.value)} placeholder="e.g. Want to transition to ML engineering, preparing for FAANG..." />
                </div>
              </motion.div>
            )}

            {/* Step 4: Resume Upload */}
            {step === 4 && (
              <motion.div key="step4" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-5">
                <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-8 text-center">
                  <Upload className="w-10 h-10 text-zinc-400 mx-auto" />
                  <h3 className="mt-4 font-semibold text-lg">Upload your resume (optional)</h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    PDF or DOC format. This helps our AI give you more accurate skill analysis and recommendations.
                  </p>
                  <label className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 font-medium cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    {resumeFile ? resumeFile.name : "Choose file"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {resumeFile && (
                    <div className="mt-3 text-sm text-zinc-200">
                      ✓ {resumeFile.name} selected ({(resumeFile.size / 1024).toFixed(0)} KB)
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-100/5 to-zinc-900/50 p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-zinc-200" />
                    <div className="font-semibold">What happens next?</div>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                    Our AI will analyze your profile, skills, and resume to create a personalized learning roadmap with courses, books, and assessments tailored to your target role.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <Button variant="ghost" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            ) : <div />}

            {step < totalSteps ? (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button disabled={busy || uploading} onClick={save}>
                {busy ? (uploading ? "Uploading resume..." : "Saving...") : "Finish setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
