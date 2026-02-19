"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

function AdminLoginForm() {
    const supabase = createClient();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    async function onLogin(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setBusy(false);
            return toast("Login failed", error.message);
        }

        // Verify this user is actually an admin
        const { data: adminUser } = await supabase
            .from("admin_users")
            .select("admin_role")
            .eq("id", data.user.id)
            .maybeSingle();

        if (!adminUser) {
            await supabase.auth.signOut();
            setBusy(false);
            return toast("Access denied", "This account is not registered as staff. Contact your administrator.");
        }

        setBusy(false);
        toast("Welcome", `Logged in as ${adminUser.admin_role.replace("_", " ")}`);
        router.push("/admin/dashboard");
    }

    return (
        <Card className="bg-black/70 border-white/15">
            <CardHeader className="p-6 pb-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold">Admin Login</h1>
                        <p className="text-sm text-zinc-500">Staff & mentor portal</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={onLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="admin@platform.edu" />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="••••••••" />
                    </div>
                    <Button disabled={busy} className="w-full" type="submit">
                        {busy ? "Verifying..." : "Admin Login"}
                    </Button>
                </form>

                <div className="mt-5 text-sm text-zinc-500">
                    Not staff?{" "}
                    <Link className="text-white hover:underline" href="/auth/login">
                        Student login
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminLoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-md">
                <Suspense fallback={<div className="text-zinc-500 text-center">Loading...</div>}>
                    <AdminLoginForm />
                </Suspense>
            </motion.div>
        </main>
    );
}
