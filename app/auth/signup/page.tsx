"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { motion } from "framer-motion";

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [course, setCourse] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setBusy(false);
      return toast("Signup failed", error.message);
    }

    const userId = data.user?.id;
    if (!userId) {
      setBusy(false);
      return toast("Signup failed", "No user returned from Supabase.");
    }

    const { error: pErr } = await supabase.from("profiles").insert({
      id: userId,
      email,
      full_name: fullName,
      phone,
      course,
      onboarded: false,
      role: "student",
    });

    setBusy(false);
    if (pErr) return toast("Profile create failed", pErr.message);

    toast("Account created", "Let’s finish your profile.");
    router.push("/onboarding");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-md">
        <Card className="bg-black/70 border-white/15">
          <CardHeader className="p-6 pb-0">
            <h1 className="text-2xl font-semibold">Create your account</h1>
            <p className="mt-1 text-sm text-zinc-500">Duolingo vibes, real career outcomes.</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={onSignup} className="space-y-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Input value={course} onChange={(e) => setCourse(e.target.value)} required placeholder="BCA / MCA / ..." />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="10-digit" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@college.edu" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="Create a strong password" />
              </div>
              <Button disabled={busy} className="w-full" type="submit">
                {busy ? "Creating..." : "Create account"}
              </Button>
            </form>

            <div className="mt-5 text-sm text-zinc-500">
              Already have an account?{" "}
              <Link className="text-white hover:underline" href="/auth/login">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
