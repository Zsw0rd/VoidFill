"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare, Shield, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { toast } from "@/components/toast/bus";
import { AmbientLights } from "@/components/AmbientLights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const adminHighlights = [
  {
    icon: Shield,
    title: "Watch the edge",
    copy: "Review flagged conversations and keep the platform clean.",
  },
  {
    icon: Users,
    title: "Guide learners",
    copy: "Track assigned students, progress movement, and weak-skill signals.",
  },
  {
    icon: MessageSquare,
    title: "Reply with context",
    copy: "Move from learner data to mentor responses without losing the thread.",
  },
];

function AdminLoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin/dashboard";

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

    // Verify this user is actually an admin.
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
    router.refresh();
    router.push(next);
  }

  return (
    <section className="relative max-w-md lg:pl-14">
      <div className="absolute left-0 top-4 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-transparent via-indigo-300/30 to-transparent lg:block" />

      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200/75">
        Staff Login
      </div>

      <div className="mt-6">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Enter the mentor desk.</h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-400 md:text-lg">
          Review learners, monitor conversations, and move straight into the admin workspace.
        </p>
      </div>

      <form onSubmit={onLogin} className="mt-10 space-y-6">
        <div className="space-y-3">
          <Label className="text-base text-zinc-200">Email</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
            placeholder="admin@platform.edu"
            className="rounded-[1.5rem] border-indigo-500/15 bg-white/[0.03] px-5 py-4 text-base placeholder:text-zinc-600"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-base text-zinc-200">Password</Label>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className="rounded-[1.5rem] border-indigo-500/15 bg-white/[0.03] px-5 py-4 text-base placeholder:text-zinc-600"
          />
        </div>
        <Button disabled={busy} className="h-14 w-full rounded-[1.5rem] text-base font-semibold" type="submit">
          {busy ? "Verifying..." : "Admin Login"}
        </Button>
      </form>

      <div className="mt-8 text-base text-zinc-500">
        Not staff?{" "}
        <Link className="text-white hover:underline" href="/auth/login">
          Student login
        </Link>
      </div>
    </section>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 sm:px-8 lg:px-12">
      <AmbientLights tone="indigo" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center"
      >
        <div className="grid w-full gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,440px)] lg:items-center">
          <section className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black">V</span>
              VoidFill Staff
            </div>

            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-white md:text-7xl">
              Lead the signal.
              <span className="block text-zinc-400">Guide the people behind it.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300 md:text-xl">
              One place to review progress, respond to students, and keep the mentoring layer focused.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {adminHighlights.map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                  <item.icon className="h-6 w-6 text-indigo-200" />
                  <div className="mt-4 text-lg font-semibold text-white">{item.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.copy}</p>
                </div>
              ))}
            </div>
          </section>

          <Suspense fallback={<div className="max-w-md text-base text-zinc-500">Loading...</div>}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </motion.div>
    </main>
  );
}
