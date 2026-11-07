"use client";

import { useId, useState } from "react";
import { ArrowRightLeft, X } from "lucide-react";
import { careerCatalogue, careerForName, careerSkillForKey, type StoredCareer } from "@/lib/careerCatalog";
import "./journey.css";

export function CareerCompare({ roles, selectedId, onChoose }: { roles: StoredCareer[]; selectedId: string; onChoose: (roleId: string) => void }) {
  const uid = useId();
  const [ids, setIds] = useState<string[]>([]);
  const available = roles.filter(role => careerForName(role.name));
  const selected = available.find(role => role.id === selectedId);
  const compared = ids.map(id => available.find(role => role.id === id)).filter((role): role is StoredCareer => !!role);
  const baseline = careerForName(selected?.name);
  const baselineKeys = new Set(baseline?.requirements.map(item => item.skill) || []);
  return <details className="career-compare">
    <summary><ArrowRightLeft size={16} /> Compare career paths<span>Up to 3 paths</span></summary>
    <p>Compare the actual work and shared learning areas before changing direction. Shared areas do not establish proficiency.</p>
    <label htmlFor={`${uid}-add`}>Add a career to compare</label><select id={`${uid}-add`} value="" disabled={ids.length >= 3} onChange={event => {if(event.target.value) setIds(current => [...current, event.target.value]);}}><option value="">{ids.length >= 3 ? "Remove a path to add another" : "Choose a career…"}</option>{available.filter(role => !ids.includes(role.id)).map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
    {compared.length === 0 && <p className="career-help">Choose two or three paths to see them alongside one another.</p>}
    <div className="career-compare-grid">{compared.map(role => {const career = careerForName(role.name)!; const shared = career.requirements.filter(item => baselineKeys.has(item.skill)); const additional = career.requirements.filter(item => !baselineKeys.has(item.skill)); return <article key={role.id}><div className="career-compare-title"><h3>{career.name}</h3><button type="button" aria-label={`Remove ${career.name} from comparison`} onClick={() => setIds(current => current.filter(id => id !== role.id))}><X size={16} /></button></div><span className="career-family-name">{careerCatalogue.families.find(item => item.key === career.family)?.name}</span><p>{career.description}</p><strong className="career-compare-label">A practical example</strong><p>{career.activity.title}</p><strong className="career-compare-label">Core learning areas</strong><ul>{career.requirements.map(item => <li key={item.skill}>{careerSkillForKey(item.skill)?.name}{!item.essential && " (supporting)"}</li>)}</ul>{baseline && baseline.id !== career.id && <p className="career-compare-transfer"><strong>{shared.length} shared learning areas</strong> with {baseline.name}.{additional.length > 0 && ` Additional areas: ${additional.map(item => careerSkillForKey(item.skill)?.name).join(", ")}.`}</p>}<button type="button" className="secondary-link" onClick={() => onChoose(role.id)}>{role.id === selectedId ? "Selected direction" : "Preview this direction"}</button></article>;})}</div>
  </details>;
}
