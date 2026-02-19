import Link from "next/link";
import { Sparkles, ArrowRight, Brain, GraduationCap, Map } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 shadow-soft backdrop-blur-xl p-8 md:p-12">
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 border border-white/10">
              <Sparkles className="w-4 h-4" /> SkillGap AI
            </span>
            <span className="text-zinc-400">Duolingo-style upskilling with real gap detection</span>
          </div>

          <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight">
            Know your skill gaps.
            <span className="text-emerald-300"> Fix them with a roadmap.</span>
          </h1>

          <p className="mt-4 text-zinc-300 max-w-2xl leading-relaxed">
            Adaptive daily checks, per-skill scoring, and a prioritized learning plan aligned to your target role.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 hover:bg-emerald-500 px-5 py-3 font-medium shadow-soft">
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 hover:bg-white/10 px-5 py-3 font-medium border border-white/10">
              Login
            </Link>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-4">
            <Feature icon={<Brain className="w-5 h-5" />} title="Skill scoring" desc="Track score per skill with daily bite-sized quizzes." />
            <Feature icon={<Map className="w-5 h-5" />} title="Roadmap" desc="Priority(skill) = CategoryRank × RoleWeight × DependencyBonus." />
            <Feature icon={<GraduationCap className="w-5 h-5" />} title="Resources" desc="Books/courses mapped to your weakest and missing skills." />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          MVP template: user-first. Admin dashboard is a placeholder.
        </p>
      </div>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        {icon}
      </div>
      <div className="mt-3 font-semibold">{title}</div>
      <div className="mt-1 text-sm text-zinc-300 leading-relaxed">{desc}</div>
    </div>
  );
}
