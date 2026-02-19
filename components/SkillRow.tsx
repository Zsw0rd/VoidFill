import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function SkillRow({ name, score, category }: { name: string; score: number; category: string }) {
  const tone = category === "Strong" ? "good" : category === "Moderate" ? "warn" : category === "Weak" ? "bad" : "bad";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{name}</div>
        <Badge tone={tone as any}>{category}</Badge>
      </div>
      <div className="mt-3">
        <Progress value={score} />
      </div>
      <div className="mt-2 text-xs text-zinc-400">{score}%</div>
    </div>
  );
}
