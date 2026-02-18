"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { motion } from "framer-motion";
import { User, Copy, LogOut, Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
    userId: string;
    email: string;
    displayName: string;
    role: string;
}

export function AdminProfileEditor({ userId, email, displayName: initName, role }: Props) {
    const supabase = createClient();
    const router = useRouter();
    const [displayName, setDisplayName] = useState(initName);
    const [saving, setSaving] = useState(false);

    async function save() {
        setSaving(true);
        const { error } = await supabase
            .from("admin_users")
            .update({ display_name: displayName.trim() || "Staff" })
            .eq("id", userId);
        setSaving(false);
        if (error) return toast("Error", error.message);
        toast("Saved", "Profile updated");
    }

    function copyUUID() {
        navigator.clipboard.writeText(userId);
        toast("Copied", "UUID copied to clipboard");
    }

    async function logout() {
        await supabase.auth.signOut();
        router.push("/");
    }

    return (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-lg mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Profile Settings</h1>

            {/* Profile Overview */}
            <Card className="bg-white/5 mb-4">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl font-bold text-indigo-300 shrink-0">
                            {(displayName || "?")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-semibold">{displayName || "Staff"}</h2>
                            <div className="text-sm text-zinc-400 capitalize">{role}</div>
                            <div className="text-xs text-zinc-500 mt-1">{email}</div>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <code className="text-[11px] text-zinc-500 bg-white/5 px-2 py-1 rounded-lg font-mono">{userId}</code>
                        <button onClick={copyUUID} className="text-zinc-500 hover:text-zinc-300 transition" title="Copy UUID">
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Display Name */}
            <Card className="bg-white/5 mb-4">
                <CardHeader className="p-5 pb-2">
                    <h3 className="text-sm font-semibold">Edit Details</h3>
                </CardHeader>
                <CardContent className="p-5 pt-2 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs">Display Name</Label>
                        <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Full Name" />
                    </div>
                    <Button onClick={save} disabled={saving} className="w-full gap-2">
                        <Save className="w-4 h-4" />
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </CardContent>
            </Card>

            {/* Logout */}
            <Card className="bg-white/5">
                <CardContent className="p-5">
                    <Button variant="soft" onClick={logout} className="w-full gap-2">
                        <LogOut className="w-4 h-4" /> Logout
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
