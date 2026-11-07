"use client";
import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type Learner = {
  id: string;
  name: string;
  email: string;
  course: string;
  active: boolean;
  xp: number;
  level: number;
  streak: number;
  score: number | null;
};
export function LearnerDirectory({ learners }: { learners: Learner[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name");
  const visible = useMemo(
    () =>
      learners
        .filter(
          (p) =>
            `${p.name} ${p.email} ${p.course}`
              .toLowerCase()
              .includes(search.toLowerCase()) &&
            (status === "all" || p.active === (status === "active")),
        )
        .sort((a, b) =>
          sort === "xp"
            ? b.xp - a.xp
            : sort === "score"
              ? (b.score ?? -1) - (a.score ?? -1)
              : a.name.localeCompare(b.name),
        ),
    [learners, search, status, sort],
  );
  return (
    <div className="max-w-6xl mx-auto">
      <p className="eyebrow mb-3">The people behind the progress</p>
      <h1 className="page-title">Learner directory.</h1>
      <p className="page-description">
        Find a learner, understand their momentum, and see where they stand.
      </p>
      <div className="mt-7 grid sm:grid-cols-3 gap-4">
        {[
          { title: "Learners in your community", value: learners.length },
          {
            title: "Profiles ready for learning",
            value: learners.filter((l) => l.active).length,
          },
          {
            title: "Getting started",
            value: learners.filter((l) => !l.active).length,
          },
        ].map((s, i) => (
          <div
            className={`panel p-5 ${i === 0 ? "!bg-[#e8eddc] !border-forest/15" : ""}`}
            key={s.title}
          >
            <p className="text-[10px] text-muted">{s.title}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {s.value}
            </p>
          </div>
        ))}
      </div>
      <section className="mt-6 panel overflow-hidden">
        <div className="p-5 border-b border-line flex flex-wrap gap-3 items-center">
          <div className="relative min-w-[180px] flex-1">
            <Search size={15} className="absolute left-3 top-3.5 text-muted" />
            <input
              aria-label="Search learners"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a name, email, or course…"
              className="w-full border border-line bg-paper rounded-lg py-3 pl-9 pr-3 text-xs outline-none focus:border-forest"
            />
          </div>
          <select
            aria-label="Filter learners by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-line rounded-lg px-3 py-3 text-xs bg-surface"
          >
            <option value="all">All profiles</option>
            <option value="active">Ready to learn</option>
            <option value="new">Getting started</option>
          </select>
          <select
            aria-label="Sort learners"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-line rounded-lg px-3 py-3 text-xs bg-surface"
          >
            <option value="name">Name A–Z</option>
            <option value="xp">Most experience</option>
            <option value="score">Highest score</option>
          </select>
        </div>
        <div
          className="hidden md:grid grid-cols-[2.3fr_1fr_1fr_.6fr_.7fr] gap-4 bg-paper px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-muted"
          aria-hidden="true"
        >
          <span>Learner</span>
          <span>Profile status</span>
          <span>Assessed average</span>
          <span>Level</span>
          <span className="text-right">Experience</span>
        </div>
        <ul className="divide-y divide-line">
          {visible.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-2 md:grid-cols-[2.3fr_1fr_1fr_.6fr_.7fr] items-center gap-4 px-6 py-5 hover:bg-paper/60 transition"
            >
              <div className="col-span-2 md:col-span-1 flex items-center gap-3 min-w-0">
                <span className="avatar">
                  {p.name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div className="min-w-0">
                  <h2 className="!text-xs font-semibold truncate">{p.name}</h2>
                  <p className="text-[10px] text-muted truncate mt-1">
                    {p.email}
                  </p>
                  <p className="text-[10px] text-muted truncate mt-1">
                    {p.course || "Background not added"}
                  </p>
                </div>
              </div>
              <div>
                <Badge tone={p.active ? "good" : "warn"}>
                  {p.active ? "Ready to learn" : "Getting started"}
                </Badge>
              </div>
              <div>
                <span className="text-xs font-semibold">
                  {p.score === null ? "Not assessed" : `${p.score}%`}
                </span>
                <div className="mt-2 max-w-[100px]">
                  <Progress value={p.score || 0} />
                </div>
              </div>
              <div className="text-xs font-semibold">
                <span className="md:hidden text-[10px] text-muted font-normal mr-2">
                  Level
                </span>
                {p.level}
              </div>
              <div className="text-xs font-semibold md:text-right">
                {p.xp.toLocaleString()}
                <span className="text-[10px] text-muted font-normal ml-1">
                  XP
                </span>
              </div>
            </li>
          ))}
        </ul>
        {!visible.length && (
          <div className="p-10 text-center">
            <Users
              size={26}
              className="mx-auto text-forest"
              strokeWidth={1.4}
            />
            <p className="mt-4 text-sm font-semibold">
              {learners.length
                ? "No learners match just yet."
                : "A little room for your community to grow."}
            </p>
            <p className="mt-2 text-xs text-muted">
              {learners.length
                ? "Try another name or reset the filters."
                : "Registered learners will appear here."}
            </p>
            {learners.length > 0 && (
              <button
                className="section-link mt-4"
                onClick={() => {
                  setSearch("");
                  setStatus("all");
                }}
              >
                Reset search & filters
              </button>
            )}
          </div>
        )}
        <div
          className="px-6 py-4 border-t border-line text-[10px] text-muted"
          role="status"
        >
          Showing {visible.length} of {learners.length} learners
        </div>
      </section>
    </div>
  );
}
