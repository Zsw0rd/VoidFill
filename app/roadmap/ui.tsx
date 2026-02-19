"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { categoryFromScore, priorityScore } from "@/lib/gapLogic";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

export function RoadmapClient({ role }: { role: any }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [roleSkills, setRoleSkills] = useState<any[]>([]);
  const [deps, setDeps] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});

  const roleId = role?.id;

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return toast("Not logged in");
    }

    if (!roleId) {
      setLoading(false);
      setItems([]);
      return;
    }

    const [rs, d, us] = await Promise.all([
      supabase.from("role_skills").select("skill_id, weight, skills(name)").eq("role_id", roleId),
      supabase.from("skill_dependencies").select("prerequisite_skill_id, dependent_skill_id"),
      supabase.from("user_skill_scores").select("skill_id, score").eq("user_id", user.id),
    ]);

    if (rs.error) return toast("Load failed", rs.error.message);
    if (d.error) return toast("Load failed", d.error.message);
    if (us.error) return toast("Load failed", us.error.message);

    setRoleSkills(rs.data || []);
    setDeps(d.data || []);
    const m: Record<string, number> = {};
    (us.data || []).forEach((r: any) => (m[r.skill_id] = r.score));
    setScores(m);

    setLoading(false);
  }, [supabase, roleId]);

  useEffect(() => {
    load();
  }, [load]);

  const computed = useMemo(() => {
    if (!roleSkills.length) return [];
    const dependsOn = new Map<string, Set<string>>();
    deps.forEach((x: any) => {
      const set = dependsOn.get(x.prerequisite_skill_id) || new Set<string>();
      set.add(x.dependent_skill_id);
      dependsOn.set(x.prerequisite_skill_id, set);
    });

    const roleSkillIds = new Set(roleSkills.map((r: any) => r.skill_id));

    const rows = roleSkills.map((r: any) => {
      const score = Number(scores[r.skill_id] ?? 0);
      const cat = categoryFromScore(score);
      const depSet = dependsOn.get(r.skill_id);
      let bonus = 1;
      if (depSet) {
        for (const dep of depSet) {
          if (roleSkillIds.has(dep)) {
            bonus = 2;
            break;
          }
        }
      }
      const p = priorityScore({ score, roleWeight: Number(r.weight ?? 0.8), dependencyBonus: bonus });
      return {
        skill_id: r.skill_id,
        name: r.skills?.name || "Skill",
        score,
        category: cat,
        role_weight: Number(r.weight ?? 0.8),
        dependency_bonus: bonus,
        priority: p,
      };
    });

    rows.sort((a, b) => b.priority - a.priority);
    return rows;
  }, [roleSkills, deps, scores]);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/roadmap/generate", { method: "POST" });
    setLoading(false);
    if (!res.ok) return toast("Generate failed", await res.text());
    toast("Roadmap saved", "Priorities updated.");
    load();
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Roadmap</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {role ? `Target: ${role.name}` : "Select a target role in onboarding to generate roadmap."}
          </p>
        </div>
        {role ? (
          <Button disabled={loading} onClick={generate}>
            {loading ? "Working..." : "Save roadmap priorities"}
          </Button>
        ) : null}
      </div>

      {!role ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-zinc-300">
          Go to onboarding and pick a target role to unlock the roadmap.
        </div>
      ) : null}

      {role && computed.length ? (
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          {computed.slice(0, 12).map((x) => {
            const tone = x.category === "Strong" ? "good" : x.category === "Moderate" ? "warn" : "bad";
            return (
              <Card key={x.skill_id} className="bg-white/5">
                <CardHeader className="p-5 pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">{x.name}</div>
                      <div className="mt-1 text-xs text-zinc-400">
                        Weight {x.role_weight} • DependencyBonus {x.dependency_bonus} • Priority {x.priority}
                      </div>
                    </div>
                    <Badge tone={tone as any}>{x.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <Progress value={x.score} />
                  <div className="mt-2 text-xs text-zinc-400">{x.score}%</div>
                  <div className="mt-4 text-sm text-zinc-300">
                    Suggested action:{" "}
                    {x.category === "Strong"
                      ? "Maintain with practice."
                      : x.category === "Moderate"
                        ? "Add projects + deeper practice."
                        : "Start fundamentals + guided resources."}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : role ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-zinc-300">
          No role skills or user scores yet. Take a daily test first.
        </div>
      ) : null}
    </motion.div>
  );
}
