"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { motion } from "framer-motion";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast("Login failed", error.message);
    router.push(next);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-md">
        <Card className="bg-zinc-900/50">
          <CardHeader className="p-6 pb-0">
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="mt-1 text-sm text-zinc-400">Continue your streak and level up.</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={onLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@college.edu" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="••••••••" />
              </div>
              <Button disabled={busy} className="w-full" type="submit">
                {busy ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-5 text-sm text-zinc-400">
              New here?{" "}
              <Link className="text-emerald-300 hover:underline" href="/auth/signup">
                Create an account
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
