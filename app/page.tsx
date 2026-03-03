import Link from "next/link";
import { ArrowRight, Brain, GraduationCap, Map, Shield } from "lucide-react";
import { AmbientLights } from "@/components/AmbientLights";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 sm:px-8 lg:px-12">
      <AmbientLights />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
        <div className="grid w-full gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)] lg:items-center">
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
              Turn weak signals into adaptive tests, focused roadmaps, and momentum you can actually act on.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <Feature icon={<Brain className="h-6 w-6 text-white" />} title="Skill scoring" desc="Track competency per skill through focused checks." />
              <Feature icon={<Map className="h-6 w-6 text-white" />} title="Roadmap" desc="Prioritize learning with transparent, weighted planning." />
              <Feature icon={<GraduationCap className="h-6 w-6 text-white" />} title="Resources" desc="Get books and courses aligned to your exact gaps." />
            </div>
          </section>

          <section className="relative lg:pl-14">
            <div className="absolute left-0 top-4 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-transparent via-white/20 to-transparent lg:block" />

            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-zinc-400">
              Choose Your Path
            </div>

            <div className="mt-6">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Enter with intent.</h2>
              <p className="mt-3 text-base leading-relaxed text-zinc-400 md:text-lg">
                Start fresh, jump back into your student flow, or head straight to the staff console.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              <Link href="/auth/signup" className="group block rounded-[1.75rem] bg-white p-6 text-black shadow-soft transition hover:bg-zinc-200">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">New Account</div>
                    <div className="mt-3 text-2xl font-semibold">Get started</div>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                      Build your profile and begin mapping skill gaps from day one.
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-6 w-6 shrink-0 transition group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                href="/auth/login"
                className="group block rounded-[1.75rem] border border-white/15 bg-white/[0.03] p-6 transition hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">Student Flow</div>
                    <div className="mt-3 text-2xl font-semibold text-white">Login</div>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      Return to your dashboard, daily tests, and the roadmap waiting for you.
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-6 w-6 shrink-0 text-white transition group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                href="/auth/admin-login"
                className="group block rounded-[1.75rem] border border-indigo-500/20 bg-indigo-500/10 p-6 text-indigo-100 transition hover:bg-indigo-500/15"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-200/70">Staff Console</div>
                    <div className="mt-3 flex items-center gap-3 text-2xl font-semibold">
                      <Shield className="h-6 w-6" />
                      Admin Login
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-indigo-100/75">
                      Review mentors, flagged chats, and learner progress from one control surface.
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-6 w-6 shrink-0 transition group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05]">
        {icon}
      </div>
      <div className="mt-4 text-lg font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-zinc-400">{desc}</div>
    </div>
  );
}
