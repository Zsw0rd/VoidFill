import { Check, Sprout } from "lucide-react";
import { Brand } from "./Brand";
export function AuthFrame({
  children,
  staff = false,
}: {
  children: React.ReactNode;
  staff?: boolean;
}) {
  return (
    <main className="auth-layout">
      <aside className="auth-story">
        <Brand />
        <div className="auth-story-content my-auto py-16">
          <div className="eyebrow mb-7">
            {staff
              ? "A place for people who guide."
              : "A little direction changes everything."}
          </div>
          <h2>
            {staff ? (
              <>
                Good guidance.
                <br />
                <em>Great possibilities.</em>
              </>
            ) : (
              <>
                Your potential,
                <br />
                <em>in progress.</em>
              </>
            )}
          </h2>
          <p className="mt-7 max-w-sm text-sm text-muted leading-7">
            {staff
              ? "See the person behind the progress. Give learners the context, clarity, and encouragement to keep going."
              : "Discover what you know. Find what’s missing. Build a learning path that takes you somewhere."}
          </p>
          <div className="mt-10 space-y-5">
            {(staff
              ? [
                  "Understand each learner’s progress",
                  "Keep conversations connected",
                  "Make every check-in count",
                ]
              : [
                  "A starting point built around you",
                  "Small assessments. Visible progress.",
                  "Guidance whenever you need it",
                ]
            ).map((s, i) => (
              <div key={s} className="flex items-center gap-3 text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-forest/20 text-forest">
                  <Check size={12} />
                </span>
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="auth-story-content flex items-center justify-between border-t border-forest/15 pt-6 text-[10px] text-muted">
          <span>Make room for what’s next.</span>
          <Sprout size={18} />
        </div>
      </aside>
      <div className="auth-form-side">{children}</div>
    </main>
  );
}
