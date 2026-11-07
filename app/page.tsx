import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileText,
  MessageCircle,
  Route,
  Sprout,
  Target,
} from "lucide-react";
import { Brand } from "@/components/Brand";

export default function Home() {
  return (
    <main className="landing">
      <nav className="landing-nav" aria-label="Public navigation">
        <Brand />
        <div className="hidden md:flex items-center gap-8 text-xs text-muted">
          <a href="#how-it-works" className="hover:text-ink">
            The approach
          </a>
          <Link href="/auth/admin-login" className="hover:text-ink">
            For mentors & teams{" "}
            <ArrowUpRight size={12} className="inline ml-1" />
          </Link>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/auth/login" className="text-xs font-semibold">
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="primary-link !px-4 !py-2.5 !text-xs"
          >
            Get started <ArrowUpRight size={14} />
          </Link>
        </div>
      </nav>
      <section className="landing-hero">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-rust rounded-full" />
            For the work you want to do.
          </div>
          <h1 className="landing-headline">
            Big ambitions.
            <br />
            Small gaps.
            <br />
            <em>Let’s fill them.</em>
          </h1>
          <p className="max-w-md text-sm sm:text-base leading-8 text-muted">
            Turn “where do I start?” into a path forward. Understand your
            skills, practice with purpose, and grow toward the role you want.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href="/auth/signup"
              className="primary-link !bg-rust hover:!bg-ink"
            >
              Find my starting point <ArrowRight size={16} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-xs font-semibold"
            >
              See the approach <ArrowDown size={14} />
            </a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-muted">
            <span className="flex items-center gap-1.5">
              <Check size={12} />
              Built for students & professionals
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={12} />
              Your pace. Your path.
            </span>
          </div>
        </div>
        <div
          className="landing-preview"
          aria-label="An illustrative learning plan"
        >
          <div className="preview-kicker">
            <span className="flex items-center gap-1.5">
              <Compass size={13} /> A clearer way forward
            </span>
            <span>Example workspace</span>
          </div>
          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Your next chapter</span>
              <span className="text-[9px] font-semibold text-forest bg-forest/10 rounded-md px-2 py-1">
                In the making
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Frontend Developer
            </h2>
            <p className="text-[11px] text-muted mt-2">
              A path from what you know to what’s next.
            </p>
            <div className="mt-7 space-y-5">
              {[
                {
                  n: "01",
                  name: "Find your baseline",
                  desc: "A quick check of your current skills",
                  icon: CheckCircle2,
                  done: true,
                },
                {
                  n: "02",
                  name: "Build your foundations",
                  desc: "Focus on the skills that matter most",
                  icon: Target,
                  done: false,
                },
                {
                  n: "03",
                  name: "Put it into practice",
                  desc: "Learn. Check in. See yourself grow.",
                  icon: Sprout,
                  done: false,
                },
              ].map((s, i) => (
                <div key={s.n} className="flex gap-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${s.done ? "bg-forest text-white border-forest" : i === 1 ? "bg-lime border-lime text-forest" : "bg-paper border-line text-muted"}`}
                  >
                    <s.icon size={17} />
                  </span>
                  <div className="pt-0.5">
                    <div className="text-xs font-semibold">{s.name}</div>
                    <div className="text-[10px] text-muted mt-1.5">
                      {s.desc}
                    </div>
                  </div>
                  <span className="ml-auto pt-2 text-[10px] text-muted/60">
                    {s.n}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Link
            href="/auth/signup"
            className="mt-4 flex items-center gap-3 rounded-xl bg-lime border border-forest/10 p-4 hover:bg-lime/70"
          >
            <MessageCircle size={19} className="text-forest" />
            <span className="flex-1">
              <span className="block text-xs font-semibold">
                You don’t have to figure it out alone.
              </span>
              <span className="text-[10px] text-forest">
                Meet Sage, your AI learning companion.
              </span>
            </span>
            <ArrowUpRight size={17} />
          </Link>
          <div className="preview-note">
            <span>
              Less guessing.
              <br />
              <strong className="font-semibold">More growing.</strong>
            </span>
            <Sprout size={27} strokeWidth={1.5} className="text-forest" />
          </div>
        </div>
      </section>
      <section id="how-it-works" className="pb-12">
        <div className="flex justify-between items-center gap-4 mb-6">
          <div className="eyebrow">A simple rhythm for real progress</div>
          <span className="text-[10px] text-muted">
            Know yourself. Grow from there.
          </span>
        </div>
        <div className="landing-method">
          {[
            {
              n: "01",
              icon: FileText,
              title: "Start with your story.",
              text: "Choose a target role or bring your resume. Create a starting point that reflects where you are.",
            },
            {
              n: "02",
              icon: ClipboardCheck,
              title: "Make the gaps visible.",
              text: "Take adaptive assessments, see your skills against role benchmarks, and know what to work on.",
            },
            {
              n: "03",
              icon: Route,
              title: "Make your next move.",
              text: "Follow a focused roadmap, explore learning resources, and check in with your mentor as you grow.",
            },
          ].map((s) => (
            <article key={s.n}>
              <div className="mb-5 flex items-center justify-between">
                <s.icon size={22} strokeWidth={1.5} className="text-forest" />
                <span className="text-xs text-muted/60">{s.n}</span>
              </div>
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <p className="mt-3 text-xs text-muted leading-6">{s.text}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="landing-footer">
        <span>
          © {new Date().getFullYear()} VoidFill. Always a work in progress.
        </span>
        <div className="flex gap-6">
          <Link href="/privacy">Privacy</Link>
          <Link href="/auth/login">
            Your workspace <ArrowUpRight size={11} className="inline" />
          </Link>
          <Link href="/auth/admin-login">
            Staff desk <ArrowUpRight size={11} className="inline" />
          </Link>
        </div>
      </footer>
    </main>
  );
}
