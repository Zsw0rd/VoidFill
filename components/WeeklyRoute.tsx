import Link from "next/link";
import { ArrowUpRight, Route } from "lucide-react";
import type { WeeklyAction } from "@/lib/learningPlan";

export function WeeklyRoute({ actions }: { actions: WeeklyAction[] }) {
  return <section className="weekly-route" aria-labelledby="weekly-route-title">
    <div className="weekly-route-heading"><div><p className="eyebrow">Small steps. Real work.</p><h2 id="weekly-route-title"><Route size={20} /> This week’s route</h2><p>A suggested sequence you can take at your own pace. Each step opens the relevant workspace.</p></div><span className="weekly-route-note">Knowledge → practice → feedback</span></div>
    <ol className="weekly-route-grid">{actions.map((item, index) => <li key={item.key}><span className="weekly-route-number">{String(index + 1).padStart(2, "0")}</span><span className="weekly-route-kind">{item.kind}</span><h3>{item.title}</h3><p>{item.description}</p><Link href={item.href}>{item.action}<ArrowUpRight size={15} /></Link></li>)}</ol>
  </section>;
}
