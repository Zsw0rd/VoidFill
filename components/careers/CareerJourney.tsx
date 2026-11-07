import Link from "next/link";
import { ArrowUpRight, Flag, GitBranch } from "lucide-react";
import { careerSkillForKey, type CareerLevel, type CareerProfile } from "@/lib/careerCatalog";
import "./careers.css";
import "./journey.css";

export function CareerJourney({ career, level, branchLinks = false, branchSkillIds = {}, practicalRoleId }: { career: CareerProfile; level: CareerLevel; branchLinks?: boolean; branchSkillIds?: Record<string,string>; practicalRoleId?: string }) {
  const path = career.curriculum?.[level];
  if (!path) return null;
  const allMilestones = [...career.curriculum.foundation.milestones, ...career.curriculum.intermediate.milestones];
  return <section className="career-journey" aria-label={`${level} milestones for ${career.name}`}>
    <div className="career-journey-heading"><div><p className="eyebrow">{level === "intermediate" ? "Apply judgment. Handle tradeoffs." : "Understand. Try. Explain."}</p><h2><Flag size={19} /> Your {level} milestones</h2></div><span>{path.milestones.length} milestones · {career.name}</span></div>
    <p className="career-journey-case">{career.curriculum.case}</p>
    <ol className="career-journey-steps">{path.milestones.map((milestone, index) => <li key={milestone.id}>
      <span className="career-journey-index">{String(index + 1).padStart(2, "0")}</span>
      <div><h3>{milestone.title}</h3><p>{milestone.outcome}</p><div className="career-journey-skills">{milestone.skill_keys.map(key => {const skill = careerSkillForKey(key); const storedId=skill && branchSkillIds[skill.name]; return skill && (branchLinks && storedId ? <Link key={key} href={`/roadmap?skill=${encodeURIComponent(storedId)}#learning-map`}><GitBranch size={12} />{skill.name}</Link> : <span key={key}>{skill.name}</span>);})}</div>
      <details><summary>What to produce and check</summary><p><strong>Deliverable:</strong> {milestone.deliverable}</p><ul>{milestone.checks.map(check => <li key={check}>{check}</li>)}</ul>{milestone.prerequisites.length > 0 && <p className="career-journey-prerequisite">Build on: {milestone.prerequisites.map(id => allMilestones.find(item => item.id === id)?.title || "earlier career activity").join("; ")}.</p>}</details></div>
    </li>)}</ol>
    <div className="career-journey-footer"><p>{path.assessment.note} Milestones describe work to attempt; opening a resource does not complete them.</p><Link href={practicalRoleId ? `/practical?career=${encodeURIComponent(practicalRoleId)}&level=${level}` : "/practical"}>Work on a practical activity<ArrowUpRight size={15} /></Link></div>
  </section>;
}
