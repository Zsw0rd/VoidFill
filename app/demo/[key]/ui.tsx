"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  GraduationCap,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { demoCareerProfiles, careerCatalogue } from "@/lib/careerCatalog";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function DemoEntry({ entryKey }: { entryKey: string }) {
  const [role, setRole] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submitting = useRef(false);
  async function start(staff = false) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/demo/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: entryKey,
          role,
          staff,
          ...(staff ? { email, password } : {}),
        }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json().catch(() => {
        throw new Error("The demo server could not respond. Please try again.");
      });
      if (!response.ok) throw new Error(result.error);
      window.location.assign(result.redirect || "/resume");
    } catch (e: any) {
      setError(
        e instanceof TypeError || e.name === "TimeoutError"
          ? "Cannot reach the local demo server. Please try again once it is available."
          : e.message,
      );
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="max-w-6xl mx-auto px-6 md:px-10 py-8">
      <header className="flex items-center justify-between border-b border-line pb-7">
        <Brand />
        <span className="eyebrow">A private look inside</span>
      </header>
      <div className="mt-12 mb-8">
        <p className="eyebrow mb-3">Explore a fresh workspace</p>
        <h1 className="page-title">Take a look around.</h1>
        <p className="page-description">
          Experience how VoidFill brings learning, progress, and guidance
          together. Each demo starts fresh.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-rust/20 bg-rust/5 p-4 text-sm text-rust"
        >
          {error}
        </p>
      )}
      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-6">
        <section className="panel p-7 md:p-8 !bg-[#e8eddc] !border-forest/20">
          <span className="icon-tile !bg-surface">
            <GraduationCap size={21} />
          </span>
          <p className="eyebrow mt-6 mb-3">The learner experience</p>
          <h2 className="text-2xl font-semibold">
            A path from here to what’s next.
          </h2>
          <p className="mt-3 text-xs leading-7 text-muted">
            Bring a resume, take an assessment, explore a roadmap, and see how
            your skills take shape. No account needed.
          </p>
          <p className="text-xs font-semibold mt-7 mb-3">
            Choose a direction to explore
          </p>
          <label htmlFor="demo-career" className="sr-only">Career foundation</label>
          <select id="demo-career" value={role} onChange={event => setRole(Number(event.target.value))} disabled={busy} className="w-full min-h-12 rounded-xl border border-forest/25 bg-surface p-3 text-sm">
            {["technical", "business"].map(kind => <optgroup key={kind} label={kind === "technical" ? "Technical foundations" : "Non-technical foundations"}>{demoCareerProfiles.map((career, index) => ({career, index})).filter(({career}) => career.release_status === "pilot" && careerCatalogue.families.find(f => f.key === career.family)?.kind === kind).map(({career, index}) => <option key={career.id} value={index}>{career.name}</option>)}</optgroup>)}
          </select>
          <p className="text-[11px] text-muted leading-6 mt-3">Start with one of 12 pilot foundations. Career explorer includes 60 profiles and lets you add a personal goal.</p>
          <Button
            loading={busy}
            onClick={() => void start()}
            className="w-full mt-6"
          >
            {busy ? (
              "Opening your workspace…"
            ) : (
              <>
                Explore as a learner
                <ArrowRight size={15} />
              </>
            )}
          </Button>
        </section>
        <section className="panel p-7 md:p-8">
          <span className="icon-tile">
            <ShieldCheck size={20} />
          </span>
          <p className="eyebrow mt-6 mb-3">The staff experience</p>
          <h2 className="text-2xl font-semibold">
            See the other side of growth.
          </h2>
          <p className="mt-3 text-xs leading-7 text-muted">
            Explore a sample community of six learners and two mentors, with
            progress, assignments, and conversations.
          </p>
          <form
            className="mt-7 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void start(true);
            }}
          >
            <label className="block space-y-2 text-xs font-semibold">
              <span>Demo email</span>
              <Input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your staff demo email"
              />
            </label>
            <label className="block space-y-2 text-xs font-semibold">
              <span>Demo password</span>
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your demo password"
              />
            </label>
            <Button
              disabled={busy}
              variant="soft"
              className="w-full mt-2"
              type="submit"
            >
              Open the staff desk
              <ArrowRight size={15} />
            </Button>
          </form>
          <p className="mt-5 text-[10px] leading-6 text-muted">
            Use the demo credentials provided to you. Each staff login opens an
            independent temporary workspace. Sample conversations are
            simulations.
          </p>
        </section>
      </div>
      <details className="mt-7 rounded-xl border border-line p-5 text-xs text-muted">
        <summary className="cursor-pointer font-semibold">
          How temporary workspaces handle your data
        </summary>
        <p className="mt-3 leading-7">
          Demo data is held in temporary server memory. Ending the demo clears
          it immediately. Closing all demo tabs clears it after a short grace
          period; a lost connection expires within about a minute. Sessions last
          at most two hours. Changes are not shared between logins. The AI
          mentor uses Gemini, so messages you send to it leave this device.
        </p>
      </details>
      <footer className="flex items-center justify-between pt-8 text-[10px] text-muted">
        <span>Try a direction. See what’s possible.</span>
        <Link href="/" className="section-link">
          Back to VoidFill
          <ArrowRight size={12} />
        </Link>
      </footer>
    </main>
  );
}
