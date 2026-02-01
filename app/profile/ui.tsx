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

export function ProfileEditor({ initial }: { initial: any }) {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState(initial.full_name || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [course, setCourse] = useState(initial.course || "");
  const [futurePlans, setFuturePlans] = useState(initial.future_plans || "");
  const [strengths, setStrengths] = useState(initial.strengths || "");
  const [weaknesses, setWeaknesses] = useState(initial.weaknesses || "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      return toast("Not logged in", "Please login again.");
    }

    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      phone,
      course,
      future_plans: futurePlans,
      strengths,
      weaknesses,
    }).eq("id", user.id);

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
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="mt-1 text-sm text-zinc-400">Keep this updated for better recommendations.</p>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
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

          <div className="space-y-2">
            <Label>Course</Label>
            <Input value={course} onChange={(e) => setCourse(e.target.value)} />
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

          <div className="flex flex-col sm:flex-row gap-3">
            <Button disabled={busy} onClick={save} className="flex-1">{busy ? "Saving..." : "Save changes"}</Button>
            <Button variant="soft" onClick={logout} className="flex-1">Logout</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
