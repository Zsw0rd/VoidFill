import Link from "next/link";
import { Sparkles, ArrowRight, Brain, GraduationCap, Map } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-6xl">
        <div className="rounded-3xl border border-white/15 bg-black/70 shadow-soft backdrop-blur-2xl p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <span className="inline-flex items-center gap-2 rounded-full bg-white text-black px-3 py-1 border border-white font-medium">
              <Sparkles className="w-4 h-4" /> SkillGap AI
            </span>
            <span className="text-zinc-500">A cleaner, faster way to close skill gaps</span>
          </div>

          <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
            A modern skill intelligence hub
            <span className="block text-zinc-400">built with black and white clarity.</span>
          </h1>

          <p className="mt-5 text-zinc-300 max-w-2xl leading-relaxed">
            Diagnose weak areas, run adaptive tests, and follow an actionable roadmap designed for your role.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white hover:bg-zinc-200 text-black px-5 py-3 font-medium shadow-soft">
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 px-5 py-3 font-medium border border-white/15">
              Login
            </Link>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-4">
            <Feature icon={<Brain className="w-5 h-5" />} title="Skill scoring" desc="Track competency per skill through focused checks." />
            <Feature icon={<Map className="w-5 h-5" />} title="Roadmap" desc="Prioritize learning with transparent, weighted planning." />
            <Feature icon={<GraduationCap className="w-5 h-5" />} title="Resources" desc="Get books and courses aligned to your exact gaps." />
          </div>
        </div>
      </div>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-zinc-950/80 p-5">
      <div className="w-10 h-10 rounded-xl bg-white text-black border border-white flex items-center justify-center">
        {icon}
      </div>
      <div className="mt-3 font-semibold">{title}</div>
      <div className="mt-1 text-sm text-zinc-400 leading-relaxed">{desc}</div>
    </div>
  );
}
