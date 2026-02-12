import Link from "next/link";
import { Sparkles, ArrowRight, Brain, GraduationCap, Map, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-6xl">
        <div className="rounded-[2rem] border border-white/10 bg-black/55 shadow-soft backdrop-blur-2xl p-8 md:p-14">
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 border border-white/20">
              <Sparkles className="w-4 h-4" /> SkillGap AI
            </span>
            <span className="text-zinc-500">Adaptive learning intelligence for serious career growth</span>
          </div>

          <h1 className="mt-8 text-4xl md:text-6xl font-semibold tracking-tight leading-tight max-w-4xl">
            Identify your skill gaps.
            <span className="block text-zinc-300">Close them with a structured AI roadmap.</span>
          </h1>

          <p className="mt-5 text-zinc-400 max-w-2xl leading-relaxed text-base md:text-lg">
            Daily assessments, per-skill scoring, personalized learning tracks, and focused recommendations to help you move from uncertainty to measurable progress.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 hover:bg-white px-6 py-3.5 font-medium text-black shadow-soft transition"
            >
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 hover:bg-white/10 px-6 py-3.5 font-medium border border-white/15 transition"
            >
              Login
            </Link>
          </div>

          <div className="mt-12 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Feature icon={<Brain className="w-5 h-5" />} title="AI Skill Profiling" desc="Understand exact strengths and weak points across your role path." />
            <Feature icon={<Map className="w-5 h-5" />} title="Roadmaps That Adapt" desc="Get dynamic progression plans prioritized by your current performance." />
            <Feature icon={<GraduationCap className="w-5 h-5" />} title="Practical Learning" desc="Follow actionable resources aligned to the gaps that matter most." />
            <Feature icon={<ShieldCheck className="w-5 h-5" />} title="Measurable Progress" desc="Track XP, streaks, and skill growth with transparent scoring." />
          </div>
        </div>
      </div>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center">{icon}</div>
      <div className="mt-4 font-semibold tracking-tight">{title}</div>
      <div className="mt-1 text-sm text-zinc-400 leading-relaxed">{desc}</div>
    </div>
  );
}
