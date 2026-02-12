"use client";

import { useState } from "react";
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
import { Upload } from "lucide-react";

export function ProfileEditor({ initial }: { initial: any }) {
  const supabase = createClient();
  const router = useRouter();

  const isStudent = initial.user_type === "student" || !initial.user_type;

  const [fullName, setFullName] = useState(initial.full_name || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [course, setCourse] = useState(initial.course || "");
  const [futurePlans, setFuturePlans] = useState(initial.future_plans || "");
  const [strengths, setStrengths] = useState(initial.strengths || "");
  const [weaknesses, setWeaknesses] = useState(initial.weaknesses || "");
  const [currentSkillsText, setCurrentSkillsText] = useState(initial.current_skills_text || "");

  // Student fields
  const [college, setCollege] = useState(initial.previous_academics?.college || "");
  const [cgpa, setCgpa] = useState(initial.previous_academics?.cgpa?.toString() || "");
  const [educationLevel, setEducationLevel] = useState(initial.education_level || "");
  const [graduationYear, setGraduationYear] = useState(initial.graduation_year?.toString() || "");

  // Professional fields
  const [company, setCompany] = useState(initial.company || "");
  const [jobTitle, setJobTitle] = useState(initial.job_title || "");
  const [yearsExperience, setYearsExperience] = useState(initial.years_experience?.toString() || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedin_url || "");

  // Resume
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return toast("Not logged in", "Please login again."); }

    let resumeUrl = initial.resume_url;
    if (resumeFile) {
      const ext = resumeFile.name.split(".").pop();
      const path = `resumes/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("uploads").upload(path, resumeFile, { upsert: true });
      if (uploadError) {
        toast("Resume upload failed", uploadError.message);
      } else {
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
        resumeUrl = urlData.publicUrl;
      }
    }

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

    if (resumeUrl) update.resume_url = resumeUrl;

    const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
    setBusy(false);
    if (error) return toast("Save failed", error.message);
    toast("Saved", "Profile updated.");
    router.refresh();
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) return toast("Logout failed", error.message);
    window.location.href = "/";
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card>
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Profile</h1>
              <p className="mt-1 text-sm text-zinc-400">Keep this updated for better recommendations.</p>
            </div>
            <Badge tone={isStudent ? "good" : "warn"}>{isStudent ? "Student" : "Professional"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Basic info */}
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

          {/* Student-specific */}
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
                  <select
                    value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-emerald-500/50"
                  >
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

          {/* Professional-specific */}
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

          {/* Skills & Plans */}
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

          {/* Resume */}
          <div className="space-y-2">
            <Label>Resume</Label>
            <div className="flex items-center gap-3">
              {initial.resume_url && (
                <a href={initial.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-300 hover:underline">
                  Current resume ↗
                </a>
              )}
              <label className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 text-sm cursor-pointer transition">
                <Upload className="w-4 h-4" />
                {resumeFile ? resumeFile.name : "Upload new"}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button disabled={busy} onClick={save} className="flex-1">{busy ? "Saving..." : "Save changes"}</Button>
            <Button variant="soft" onClick={logout} className="flex-1">Logout</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
