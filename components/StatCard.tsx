import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function StatCard({ title, value, sub, progress }: { title: string; value: string; sub?: string; progress?: number }) {
  return (
    <Card className="bg-white/5">
      <CardContent className="p-5">
        <div className="text-sm text-zinc-300">{title}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        {sub ? <div className="mt-1 text-xs text-zinc-400">{sub}</div> : null}
        {typeof progress === "number" ? <div className="mt-4"><Progress value={progress} /></div> : null}
      </CardContent>
    </Card>
  );
}
