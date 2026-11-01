"use client";

import { UserPlus, Users, ArrowRight } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/toast/bus";

export function MentorActions({
  allUsers,
  staff,
}: {
  allUsers: any[];
  staff: any[];
}) {
  const supabase = createClient();
  const [addUid, setAddUid] = useState("");
  const [addRole, setAddRole] = useState<"admin" | "mentor">("mentor");
  const [addName, setAddName] = useState("");
  const [busy, setBusy] = useState<"add" | "assign" | null>(null);

  // Mentor assignment
  const [mentorId, setMentorId] = useState("");
  const [studentId, setStudentId] = useState("");

  async function addStaff() {
    if (!addUid.trim()) return toast("Missing", "Enter the user ID");
    setBusy("add");
    const { error } = await supabase.from("admin_users").insert({
      id: addUid.trim(),
      admin_role: addRole,
      display_name: addName.trim() || "Staff",
    });
    setBusy(null);
    if (error) return toast("Error", error.message);
    toast("Done", `${addRole} added`);
    setAddUid("");
    setAddName("");
    window.location.reload();
  }

  async function assignStudent() {
    if (!mentorId.trim() || !studentId.trim())
      return toast("Missing", "Enter both IDs");
    setBusy("assign");
    const { error } = await supabase.from("mentor_assignments").insert({
      mentor_id: mentorId.trim(),
      user_id: studentId.trim(),
    });
    setBusy(null);
    if (error) return toast("Error", error.message);
    toast("Done", "Student assigned to mentor");
    setMentorId("");
    setStudentId("");
    window.location.reload();
  }

  const learners = allUsers.filter(
    (user) => !staff.some((s) => s.id === user.id),
  );
  const mentors = staff.filter((s) => s.admin_role === "mentor");
  return (
    <div className="mt-7 grid lg:grid-cols-2 gap-5">
      <section className="panel p-6">
        <div className="flex items-center gap-3">
          <span className="icon-tile">
            <UserPlus size={18} />
          </span>
          <div>
            <p className="eyebrow mb-1">Grow the support circle</p>
            <h2 className="font-semibold">Add a staff member</h2>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted leading-6">
          Choose an existing account and give them a role in your team.
        </p>
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-staff-account">Existing account</Label>
            <select
              id="new-staff-account"
              value={allUsers.some((u) => u.id === addUid) ? addUid : ""}
              onChange={(e) => {
                setAddUid(e.target.value);
                const user = allUsers.find((u) => u.id === e.target.value);
                if (user) setAddName(user.full_name || "");
              }}
              className="w-full rounded-xl border border-line bg-surface p-3 text-xs"
            >
              <option value="">Choose a registered person</option>
              {learners.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email} · {u.email}
                </option>
              ))}
            </select>
          </div>
          <details className="text-[10px] text-muted">
            <summary className="cursor-pointer">
              Use an account ID instead
            </summary>
            <Input
              aria-label="Existing account UUID"
              value={addUid}
              onChange={(e) => setAddUid(e.target.value)}
              placeholder="Existing account UUID"
              className="mt-2 text-xs"
            />
          </details>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Display name</Label>
              <Input
                id="staff-name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Their name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">Team role</Label>
              <select
                id="staff-role"
                value={addRole}
                onChange={(e) =>
                  setAddRole(e.target.value as "admin" | "mentor")
                }
                className="w-full min-h-12 rounded-xl border border-line bg-surface p-3 text-xs"
              >
                <option value="mentor">Mentor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>
          <Button
            onClick={addStaff}
            disabled={!!busy || !addUid.trim()}
            loading={busy === "add"}
            className="w-full"
          >
            {busy === "add" ? (
              "Adding to your team…"
            ) : (
              <>
                Add staff member
                <ArrowRight size={14} />
              </>
            )}
          </Button>
        </div>
      </section>
      <section className="panel p-6">
        <div className="flex items-center gap-3">
          <span className="icon-tile">
            <Users size={18} />
          </span>
          <div>
            <p className="eyebrow mb-1">Make a useful connection</p>
            <h2 className="font-semibold">Connect a learner & mentor</h2>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted leading-6">
          An assignment lets a mentor follow a learner’s progress and support
          them in chat.
        </p>
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assignment-mentor">Mentor</Label>
            <select
              id="assignment-mentor"
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
              className="w-full min-h-12 rounded-xl border border-line bg-surface p-3 text-xs"
            >
              <option value="">Choose a mentor</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name || "Mentor"}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignment-learner">Learner</Label>
            <select
              id="assignment-learner"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full min-h-12 rounded-xl border border-line bg-surface p-3 text-xs"
            >
              <option value="">Choose a learner</option>
              {learners.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email} · {u.email}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="soft"
            onClick={assignStudent}
            disabled={!!busy || !mentorId || !studentId}
            loading={busy === "assign"}
            className="w-full"
          >
            {busy === "assign" ? (
              "Making the connection…"
            ) : (
              <>
                Connect learner & mentor
                <ArrowRight size={14} />
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}
