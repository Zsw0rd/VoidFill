"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { Input } from "@/components/ui/input";

type Role = { id: string; name: string; description: string | null };

export function OnboardingForm({ roles }: { roles: Role[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [targetRoleId, setTargetRoleId] = useState(roles[0]?.id || "");
  const [futurePlans, setFuturePlans] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [college, setCollege] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      return toast("Not logged in", "Please login again.");
    }

    const previous_academics = {
      college: college || null,
      cgpa: cgpa ? Number(cgpa) : null,
    };

    const { error } = await supabase
      .from("profiles")
      .update({
        target_role_id: targetRoleId || null,
        future_plans: futurePlans,
        strengths,
        weaknesses,
        previous_academics,
        onboarded: true,
      })
      .eq("id", user.id);

    setBusy(false);
    if (error) return toast("Save failed", error.message);
    toast("Profile updated", "You’re ready. Let’s go.");
    router.push("/dashboard");
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card>
        <CardHeader className="p-6 pb-0">
          <h1 className="text-2xl font-semibold">Quick setup</h1>
          <p className="mt-1 text-sm text-zinc-400">
            This data helps build your roadmap and track progress.
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Target role</Label>
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
                      active ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <div className="font-semibold">{r.name}</div>
                    <div className="mt-1 text-sm text-zinc-400">{r.description || "Role track"}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>College</Label>
              <Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="Dayananda Sagar University" />
            </div>
            <div className="space-y-2">
              <Label>CGPA (optional)</Label>
              <Input value={cgpa} onChange={(e) => setCgpa(e.target.value)} placeholder="8.2" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Future plans</Label>
            <Textarea value={futurePlans} onChange={(e) => setFuturePlans(e.target.value)} placeholder="E.g. Data analyst role, internships, MCA/MS plans..." />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Strengths</Label>
              <Textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="E.g. problem solving, communication..." />
            </div>
            <div className="space-y-2">
              <Label>Weaknesses</Label>
              <Textarea value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} placeholder="E.g. consistency, DSA depth..." />
            </div>
          </div>

          <Button disabled={busy} onClick={save} className="w-full">
            {busy ? "Saving..." : "Finish setup"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
