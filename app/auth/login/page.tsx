"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Radar, Route } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { toast } from "@/components/toast/bus";
import { AmbientLights } from "@/components/AmbientLights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginHighlights = [
  {
    icon: Radar,
    title: "Read the signal",
    copy: "Spot the weak skills that need attention first.",
  },
  {
    icon: Route,
    title: "Move with intent",
    copy: "Drop straight back into the roadmap that matters next.",
  },
  {
    icon: Brain,
    title: "Train sharper",
    copy: "Use adaptive tests and guided feedback to close the gap.",
  },
];

function LoginForm() {
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      return toast("Login failed", error.message);
    }

    // Block admin/staff from logging in via regular login.
    if (data.user) {
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("admin_role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (adminRow) {
        await supabase.auth.signOut();
        setBusy(false);
        return toast("Admin account detected", "Please use the Admin Login page instead.");
      }
    }

    setBusy(false);
    router.refresh();
    router.push(next);
  }

  return (
    <section className="relative max-w-md lg:pl-14">
      <div className="absolute left-0 top-4 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-transparent via-white/20 to-transparent lg:block" />

      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-zinc-400">
        Student Login
      </div>

      <div className="mt-6">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Resume the run.</h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-400 md:text-lg">
          Return to your dashboard, today&apos;s test, and the roadmap waiting for you.
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
            placeholder="you@college.edu"
            className="rounded-[1.5rem] border-white/20 bg-white/[0.03] px-5 py-4 text-base placeholder:text-zinc-600"
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
            className="rounded-[1.5rem] border-white/20 bg-white/[0.03] px-5 py-4 text-base placeholder:text-zinc-600"
          />
        </div>
        <Button disabled={busy} className="h-14 w-full rounded-[1.5rem] text-base font-semibold" type="submit">
          {busy ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="mt-8 space-y-3 text-base text-zinc-500">
        <div>
          New here?{" "}
          <Link className="text-white hover:underline" href="/auth/signup">
            Create an account
          </Link>
        </div>
        <div>
          Staff?{" "}
          <Link className="text-indigo-300 hover:underline" href="/auth/admin-login">
            Admin Login
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 sm:px-8 lg:px-12">
      <AmbientLights />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center"
      >
        <div className="grid w-full gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,440px)] lg:items-center">
          <section className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black">V</span>
              VoidFill
            </div>

            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-white md:text-7xl">
              See the gap.
              <span className="block text-zinc-400">Build the edge.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300 md:text-xl">
              Adaptive tests, role-weighted roadmaps, and mentor feedback in one sharp workspace.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {loginHighlights.map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                  <item.icon className="h-6 w-6 text-white" />
                  <div className="mt-4 text-lg font-semibold text-white">{item.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.copy}</p>
                </div>
              ))}
            </div>
          </section>

          <Suspense fallback={<div className="max-w-md text-base text-zinc-500">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </motion.div>
    </main>
  );
}
