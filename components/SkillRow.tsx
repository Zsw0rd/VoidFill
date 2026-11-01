import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function SkillRow({
  name,
  score,
  category,
}: {
  name: string;
  score: number;
  category: string;
}) {
  const tone =
    category === "Strong"
      ? "good"
      : category === "Moderate"
        ? "warn"
        : category === "Weak"
          ? "bad"
          : "bad";
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold">{name}</div>
        <Badge tone={tone as any}>{category}</Badge>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Progress value={score} />
        <span className="text-[10px] text-muted tabular-nums w-8 text-right">
          {score}%
        </span>
      </div>
    </div>
  );
}
