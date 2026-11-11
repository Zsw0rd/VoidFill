"use client";
import { PERSONAL_GOAL_NAME } from "@/lib/careerCatalog";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  FileUp,
  Loader2,
  Check,
  FileText,
  LockKeyhole,
  ScanText,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
type Parsed = {
  filename: string;
  name: string;
  email: string;
  phone: string;
  skills: { name: string; evidence: string }[];
  matched_app_skills: { name: string; evidence_skills: string[] }[];
  sections: Record<string, string[]>;
  role_suggestions: { name: string; similarity: number }[];
  text: string;
  pages: number | null;
  page_count_known: boolean;
  methods: string[];
  warnings: string[];
  note: string;
  model: string;
};
export function ResumeUI({
  profile,
  roles,
}: {
  profile: any;
  roles: { id: string; name: string }[];
}) {
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<Parsed | null>(null);
  const [busy, setBusy] = useState(false),
    [saving, setSaving] = useState(false);
  const [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState(profile?.full_name || "");
  const [role, setRole] = useState("");
  const [keepExisting, setKeepExisting] = useState(true);
  const [existingSkills, setExistingSkills] = useState(
    profile?.current_skills_text || "",
  );
  const busyRequest = useRef(false), savingRequest = useRef(false);
  const uploadInput = useRef<HTMLInputElement>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const errorNotice = useRef<HTMLParagraphElement>(null);
  const savedNotice = useRef<HTMLDivElement>(null);
  const evidenceId = useId();
  const [focusIntent, setFocusIntent] = useState<{ target: "upload" | "review" | "error" | "saved" } | null>(null);
  useEffect(() => {
    if (!focusIntent) return;
    ({upload: uploadInput, review: reviewHeading, error: errorNotice, saved: savedNotice})[focusIntent.target].current?.focus();
  }, [focusIntent]);
  async function upload(file?: File) {
    if (!file || busyRequest.current || savingRequest.current) return;
    setError("");
    setSaved(false);
    if (file.size > 4 * 1024 * 1024 || !/\.(pdf|docx)$/i.test(file.name)) {
      setError("Choose a PDF or DOCX up to 4 MB.");
      setFocusIntent({target: "error"});
      return;
    }
    busyRequest.current = true;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/resume", {
        method: "POST",
        body: form,
      });
      const parsed = await response.json();
      if (!response.ok) throw new Error(parsed.error);
      setResult(parsed);
      setSelected(parsed.skills.map((s: any) => s.name));
      setName(parsed.name || profile?.full_name || "");
      setFocusIntent({target: "review"});
    } catch (e: any) {
      setError(e.message);
      setFocusIntent({target: "error"});
    } finally {
      busyRequest.current = false;
      setBusy(false);
    }
  }
  async function apply() {
    if (!result || busyRequest.current || savingRequest.current) return;
    savingRequest.current = true;
    setSaving(true);
    setError("");
    try {
      const previous = keepExisting
        ? existingSkills
            .split(/[,;\n]/)
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];
      const nextSkills = [...new Set([...previous, ...selected])];
      const response = await fetch("/api/resume", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          skills: nextSkills,
          ...(role ? { role_id: role } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setExistingSkills(nextSkills.join(", "));
      setSaved(true);
      setFocusIntent({target: "saved"});
    } catch (e: any) {
      setError(e.message);
      setFocusIntent({target: "error"});
    } finally {
      savingRequest.current = false;
      setSaving(false);
    }
  }
  return (
    <div className="max-w-5xl mx-auto space-y-7">
      <header>
        <p className="eyebrow mb-3">01 / Your starting point</p>
        <h1 className="page-title">There’s a story in your resume.</h1>
        <p className="page-description">
          Bring what you’ve already done. Turn your experience into a starting
          point for what comes next.
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted">
        <span className={result ? "text-forest" : "font-semibold text-ink"}>
          01 &nbsp; Upload your resume
        </span>
        <ArrowRight size={12} />
        <span className={result && !saved ? "font-semibold text-ink" : ""}>
          02 &nbsp; Review what we found
        </span>
        <ArrowRight size={12} />
        <span className={saved ? "font-semibold text-forest" : ""}>
          03 &nbsp; Make it yours
        </span>
      </div>
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        <label
          className={`upload-zone flex flex-col items-center justify-center ${busy ? "opacity-60 cursor-wait" : ""}`}
          data-dragging={dragging}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy && !saving) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!busy && !saving) void upload(e.dataTransfer.files[0]);
          }}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-forest/15 text-forest">
            {busy ? (
              <Loader2 className="animate-spin" size={25} />
            ) : (
              <FileUp size={25} strokeWidth={1.5} />
            )}
          </span>
          <span className="block mt-5 text-lg font-semibold">
            {busy
              ? "Finding the story in your resume…"
              : "Drop your resume here"}
          </span>
          <span className="mt-2 text-xs text-muted">
            {busy ? (
              "Hang tight. This may take a moment for scanned pages."
            ) : (
              <>
                or{" "}
                <span className="font-semibold text-forest underline underline-offset-4">
                  browse your files
                </span>
              </>
            )}
          </span>
          <span className="block mt-6 text-[10px] text-muted">
            PDF or DOCX · up to 4 MB · up to 12 PDF pages
          </span>
          <input
            ref={uploadInput}
            aria-label="Upload resume"
            type="file"
            accept=".pdf,.docx"
            disabled={busy || saving}
            className="sr-only"
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <aside className="panel p-6">
          <p className="eyebrow">From document to direction</p>
          <div className="mt-6 space-y-5">
            {[
              {
                Icon: ScanText,
                title: "Find the useful details",
                text: "We read skills, experience, education, and projects from your document.",
              },
              {
                Icon: ListChecks,
                title: "You stay in control",
                text: "Review the extraction. Choose the skills and name you want to save.",
              },
              {
                Icon: LockKeyhole,
                title: "Keep your story yours",
                text: "Your original file is not retained. Only the profile fields you apply are saved.",
              },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="flex gap-3">
                <Icon
                  size={17}
                  className="text-forest mt-0.5"
                  strokeWidth={1.5}
                />
                <div>
                  <h2 className="!text-xs font-semibold">{title}</h2>
                  <p className="mt-1.5 text-[11px] leading-5 text-muted">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <p className="text-[11px] leading-6 text-muted">
        A resume shows what you’ve worked with. Assessments help measure what
        you know. Imported skills won’t change your scores or XP.
      </p>
      {busy && (
        <p role="status" className="sr-only">
          Reading your resume. Please wait.
        </p>
      )}
      {error && (
        <p
          ref={errorNotice}
          tabIndex={-1}
          role="alert"
          className="rounded-xl border border-rust/20 p-4 bg-rust/5 text-sm text-rust"
        >
          {error}
        </p>
      )}
      {result && (
        <>
          <section className="panel p-6 md:p-8 space-y-6" aria-busy={busy || saving || undefined}>
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-3 items-center">
                <span className="icon-tile">
                  <FileText size={19} />
                </span>
                <div>
                  <p className="eyebrow mb-1">02 / Review & refine</p>
                  <h2 ref={reviewHeading} tabIndex={-1} className="font-semibold">Here’s what we found.</h2>
                </div>
              </div>
              <Badge tone="good">{selected.length} skills selected</Badge>
            </div>
            <p className="text-[11px] text-muted">
              {result.filename} · {result.pages === null || result.page_count_known === false
                ? "DOCX document · page count unavailable"
                : `${result.pages} ${result.pages === 1 ? "page" : "pages"}`}
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              <label className="block text-xs font-semibold">
                Your name
                <Input
                  className="mt-2"
                  value={name}
                  disabled={busy || saving}
                  maxLength={120}
                  onChange={(e) => {setName(e.target.value); setSaved(false);}}
                />
              </label>
              <label className="block text-xs font-semibold">
                Target role
                <select
                  className="block mt-2 w-full min-h-12 p-3 rounded-xl bg-surface border border-line text-sm font-normal"
                  value={role}
                  disabled={busy || saving}
                  onChange={(e) => {setRole(e.target.value); setSaved(false);}}
                >
                  <option value="">Keep current target</option>
                  {roles.filter(r => r.name !== PERSONAL_GOAL_NAME).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="border-y border-line py-5">
              <h3 className="text-sm font-semibold">
                Skills to bring into your profile
              </h3>
              <p className="mt-2 text-[11px] text-muted">
                Select the skills you want to keep. Expand “Take a closer look
                at the extraction” below to review where each skill was mentioned.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.skills.map((skill, index) => (
                  <label
                    key={skill.name}
                    title={skill.evidence}
                    className={`rounded-lg border px-3 py-2.5 text-xs cursor-pointer transition ${selected.includes(skill.name) ? "border-forest/30 bg-forest/5 text-forest" : "border-line text-muted"}`}
                  >
                    <input
                      className="mr-2 accent-forest"
                      type="checkbox"
                      checked={selected.includes(skill.name)}
                      disabled={busy || saving}
                      aria-describedby={`${evidenceId}-${index}`}
                      onChange={(e) => {
                        setSaved(false);
                        setSelected((s) =>
                          e.target.checked
                            ? [...s, skill.name]
                            : s.filter((n) => n !== skill.name),
                        );
                      }}
                    />
                    {skill.name}
                    <span hidden id={`${evidenceId}-${index}`}>{skill.evidence}</span>
                  </label>
                ))}
              </div>
              {!result.skills.length && (
                <p className="text-muted text-sm mt-4">
                  No supported skill mentions found. You can add your skills in
                  your profile.
                </p>
              )}
              <label className="flex min-h-11 items-center mt-5 text-xs text-muted">
                <input
                  className="mr-2 accent-forest"
                  type="checkbox"
                  checked={keepExisting}
                  disabled={busy || saving}
                  onChange={(e) => {setKeepExisting(e.target.checked); setSaved(false);}}
                />
                Keep skills already in my profile
              </label>
            </div>
            <div className="text-[11px] text-muted leading-6 space-y-2">
              <p>
                Contact detected:{" "}
                {[result.email, result.phone].filter(Boolean).join(" · ") ||
                  "None"}
                . Shown for your review; contact details won’t be applied.
              </p>
              {result.role_suggestions[0] && (
                <p>
                  Closest career context:{" "}
                  <span className="font-semibold">
                    {result.role_suggestions[0].name}
                  </span>
                  . This is a suggestion, not a skill assessment.
                </p>
              )}
              {result.matched_app_skills.length > 0 && (
                <p>
                  Related learning areas:{" "}
                  {result.matched_app_skills.map((s) => s.name).join(", ")}.
                </p>
              )}
            </div>
            <Button disabled={busy} loading={saving} onClick={apply}>
              {saving ? (
                "Saving your changes…"
              ) : (
                <>
                  Apply to my profile
                  <ArrowRight size={15} />
                </>
              )}
            </Button>
            {saved && (
              <div
                ref={savedNotice}
                tabIndex={-1}
                role="status"
                className="rounded-xl border border-forest/20 bg-forest/5 p-4 text-forest flex flex-wrap items-center gap-3 text-xs"
              >
                <Check size={17} />
                <span className="font-semibold">
                  Your profile has a new starting point.
                </span>
                <Link
                  href="/daily-test"
                  className="underline underline-offset-4"
                >
                  Take a baseline assessment
                </Link>
                <Link href="/roadmap" className="underline underline-offset-4">
                  Explore roadmap
                </Link>
              </div>
            )}
          </section>
          <div className="grid md:grid-cols-2 gap-5">
            {Object.entries(result.sections)
              .filter(([key]) =>
                [
                  "education",
                  "experience",
                  "projects",
                  "certifications",
                ].includes(key),
              )
              .map(([key, lines]) => (
                <section key={key} className="panel p-6">
                  <h2 className="capitalize font-semibold">{key}</h2>
                  <p className="mt-4 whitespace-pre-wrap text-xs leading-7 text-muted">
                    {lines.join("\n")}
                  </p>
                </section>
              ))}
          </div>
          <details className="panel p-6">
            <summary className="cursor-pointer text-sm font-semibold">
              Take a closer look at the extraction
            </summary>
            <pre className="mt-4 text-xs leading-7 font-sans whitespace-pre-wrap break-words text-muted">
              {result.text}
            </pre>
            <ul className="mt-4 text-xs leading-6 space-y-2">
              {result.skills.map((s) => (
                <li key={s.name}>
                  <strong>{s.name}:</strong> {s.evidence}
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-line pt-4 text-[11px] text-muted space-y-2">
              {result.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
              <p>
                Processing: {result.methods.join(", ")}. Career context:{" "}
                {result.model}.
              </p>
            </div>
          </details>
          <button
            disabled={busy || saving}
            className="text-xs underline underline-offset-4 text-muted"
            onClick={() => {
              setResult(null);
              setSelected([]);
              setName(profile?.full_name || "");
              setSaved(false);
              setFocusIntent({target: "upload"});
            }}
          >
            Clear this extraction
          </button>
        </>
      )}
    </div>
  );
}
