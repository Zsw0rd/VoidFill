"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/toast/bus";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function MentorActions({ allUsers }: { allUsers: any[] }) {
    const supabase = createClient();
    const [addUid, setAddUid] = useState("");
    const [addRole, setAddRole] = useState<"admin" | "mentor">("mentor");
    const [addName, setAddName] = useState("");
    const [busy, setBusy] = useState(false);

    // Mentor assignment
    const [mentorId, setMentorId] = useState("");
    const [studentId, setStudentId] = useState("");

    async function addStaff() {
        if (!addUid.trim()) return toast("Missing", "Enter the user ID");
        setBusy(true);
        const { error } = await supabase.from("admin_users").insert({
            id: addUid.trim(),
            admin_role: addRole,
            display_name: addName.trim() || "Staff",
        });
        setBusy(false);
        if (error) return toast("Error", error.message);
        toast("Done", `${addRole} added`);
        setAddUid(""); setAddName("");
        window.location.reload();
    }

    async function assignStudent() {
        if (!mentorId.trim() || !studentId.trim()) return toast("Missing", "Enter both IDs");
        setBusy(true);
        const { error } = await supabase.from("mentor_assignments").insert({
            mentor_id: mentorId.trim(),
            user_id: studentId.trim(),
        });
        setBusy(false);
        if (error) return toast("Error", error.message);
        toast("Done", "Student assigned to mentor");
        setMentorId(""); setStudentId("");
        window.location.reload();
    }

    return (
        <div className="mt-6 space-y-6">
            {/* ═══ Section 1: Add Staff ═══ */}
            <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold">1</span>
                    Add Staff Member
                </h2>
                <Card className="bg-white/5 border-indigo-500/10">
                    <CardContent className="p-5 space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs">User ID (UUID from auth)</Label>
                            <Input value={addUid} onChange={e => setAddUid(e.target.value)} placeholder="User UUID" className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Display Name</Label>
                            <Input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Name" className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Role</Label>
                            <select value={addRole} onChange={e => setAddRole(e.target.value as any)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-200">
                                <option value="mentor">Mentor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <Button onClick={addStaff} disabled={busy} className="w-full text-xs">
                            {busy ? "Adding..." : "Add Staff"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* ═══ Divider ═══ */}
            <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-white/10" />
                <span className="text-xs text-zinc-600 uppercase tracking-widest">or</span>
                <div className="flex-1 border-t border-white/10" />
            </div>

            {/* ═══ Section 2: Assign Student ═══ */}
            <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs font-bold">2</span>
                    Assign Student to Mentor
                </h2>
                <Card className="bg-white/5 border-emerald-500/10">
                    <CardContent className="p-5 space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Mentor ID (UUID)</Label>
                            <Input value={mentorId} onChange={e => setMentorId(e.target.value)} placeholder="Mentor UUID" className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Student ID (UUID)</Label>
                            <Input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student UUID" className="text-xs" />
                        </div>
                        <Button onClick={assignStudent} disabled={busy} className="w-full text-xs">
                            {busy ? "Assigning..." : "Assign Student"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
