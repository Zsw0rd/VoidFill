"use client";

import { useId, useMemo, useState } from "react";
import { BookOpen, Check, Compass, PenLine, Search } from "lucide-react";
import { careerCatalogue, careerCoverage, careerForName, careerSkillForKey, careerSkillForName, matchCareers, MAX_FOCUS_SKILLS, PERSONAL_GOAL_NAME, type CareerLevel, type StoredCareer } from "@/lib/careerCatalog";
import "./careers.css";

export type AvailableSkill = {id: string; name: string};
export type CareerChoice = {roleId: string; goal: string; level: CareerLevel; focusIds: string[]; context: string};
type Props = {roles: StoredCareer[]; skills: AvailableSkill[]; value: CareerChoice; onChange: (value: CareerChoice) => void; disabled?: boolean};

export function CareerPicker({roles, skills, value, onChange, disabled = false}: Props) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [visible, setVisible] = useState(8);
  const selected = roles.find(role => role.id === value.roleId);
  const profile = careerForName(selected?.name);
  const personal = selected?.name === PERSONAL_GOAL_NAME;
  const personalRole = roles.find(role => role.name === PERSONAL_GOAL_NAME);
  const coverage = profile ? careerCoverage(profile) : null;
  const baseline = new Set((profile?.requirements || []).map(item => careerSkillForKey(item.skill)!.name));
  const availableRoles = roles.filter(role => careerForName(role.name));
  const matches = useMemo(() => query.trim() ? matchCareers(query, roles) : [], [query, roles]);
  const results = useMemo(() => {
    const source = query.trim() ? matches.map(item => ({stored: item.stored!, profile: item.role, evidence: item.evidence})) : availableRoles.map(stored => ({stored, profile: careerForName(stored.name)!, evidence: [] as string[]})).sort((a, b) => Number(b.profile.release_status === "pilot") - Number(a.profile.release_status === "pilot") || a.profile.name.localeCompare(b.profile.name));
    return source.filter(item => !family || item.profile.family === family);
  }, [query, matches, availableRoles, family]);
  const focusOptions = skills.filter(skill => careerSkillForName(skill.name) && (!skillQuery.trim() || [skill.name, ...(careerSkillForName(skill.name)?.aliases || [])].some(name => (skillQuery.trim().includes(" ") ? name.toLowerCase().includes(skillQuery.trim().toLowerCase()) : name.toLowerCase().split(/[^a-z0-9]+/).some(word => word.startsWith(skillQuery.trim().toLowerCase())))))).sort((a, b) => Number(value.focusIds.includes(b.id)) - Number(value.focusIds.includes(a.id)) || a.name.localeCompare(b.name));

  function choose(id: string) {
    const next = roles.find(role => role.id === id);
    const nextProfile = careerForName(next?.name);
    const required = new Set((nextProfile?.requirements || []).map(item => careerSkillForKey(item.skill)!.name));
    onChange({...value, roleId: id, focusIds: value.focusIds.filter(skillId => !required.has(skills.find(skill => skill.id === skillId)?.name || ""))});
  }

  return <section className="career-picker" aria-label="Choose your career direction">
    <div className="career-discovery-heading"><Compass size={20} /><div><strong>Find your direction</strong><p>Explore technical, creative and business careers. Choose a foundation, then make it yours.</p></div></div>
    <div className="career-search-row">
      <div><label htmlFor={`${uid}-search`}>Search a career or describe the work</label><div className="career-search-input"><Search size={16} /><input id={`${uid}-search`} type="search" placeholder="Try recruiter, cloud support, graphic designer…" value={query} maxLength={2000} disabled={disabled} onChange={event => {setQuery(event.target.value); setVisible(8);}} /></div></div>
      <div><label htmlFor={`${uid}-family`}>Career field</label><select id={`${uid}-family`} value={family} disabled={disabled} onChange={event => {setFamily(event.target.value); setVisible(8);}}><option value="">All fields</option>{careerCatalogue.families.map(item => <option key={item.key} value={item.key}>{item.name}</option>)}</select></div>
    </div>
    <p className="career-result-count" role="status">{results.length} {query ? "matching" : "available"} profiles{query && " · suggestions need your confirmation"}</p>
    <div className="career-results">
      {results.slice(0, visible).map(({stored, profile: item, evidence}) => {
        const itemCoverage = careerCoverage(item);
        return <button key={stored.id} type="button" className="career-result" aria-pressed={stored.id === value.roleId} disabled={disabled} onClick={() => choose(stored.id)}>
          <span className="career-result-top"><span className="career-family-name">{careerCatalogue.families.find(f => f.key === item.family)?.name}</span>{stored.id === value.roleId && <Check size={16} />}</span>
          <strong>{stored.name}</strong><span className="career-result-description">{item.description}</span>
          <span className="career-result-bottom"><span className={item.release_status === "pilot" ? "career-pilot" : "career-explore"}>{item.release_status === "pilot" ? "Pilot foundation" : "Explore this career"}</span><span>{itemCoverage.covered}/{itemCoverage.total} knowledge areas covered</span></span>
          {!!query && evidence.length > 0 && <span className="career-match-reason">Matches: {evidence.join(", ")}</span>}
        </button>;
      })}
    </div>
    {!results.length && <div className="career-empty"><strong>No clear match yet.</strong><p>Try a fuller job title or another field. You can also name a personal goal and choose its focus skills below.</p></div>}
    {results.length > visible && <button className="career-show-more" type="button" disabled={disabled} onClick={() => setVisible(count => count + 12)}>Show {Math.min(12, results.length - visible)} more careers</button>}

    <div className="career-personal-fields">
      <div><label htmlFor={`${uid}-goal`}>Personal career goal <span>(optional)</span></label><input id={`${uid}-goal`} value={value.goal} maxLength={160} disabled={disabled} placeholder="For example: customer success in renewable energy" onChange={event => onChange({...value, goal: event.target.value})} /><div className="career-inline-actions"><button type="button" disabled={disabled || !value.goal.trim()} onClick={() => {setQuery(value.goal); setFamily(""); setVisible(8);}}>Find matching profiles</button>{personalRole && <button type="button" disabled={disabled || !value.goal.trim()} onClick={() => choose(personalRole.id)}>Build from my focus skills</button>}</div></div>
      <div><label htmlFor={`${uid}-level`}>Learning level</label><select id={`${uid}-level`} value={value.level} disabled={disabled} onChange={event => onChange({...value, level: event.target.value as CareerLevel})}><option value="foundation">Foundation · build core knowledge</option><option value="intermediate">Intermediate · higher learning targets</option></select><p className="career-help">Question difficulty stays within the available content. These paths do not certify professional competence.</p></div>
    </div>

    {selected && <div className="career-selection" aria-live="polite">
      <p className="career-section-label">Your selected direction</p><h3>{personal ? value.goal || "Your personal goal" : selected.name}</h3>
      {!!value.goal.trim() && !personal && <p className="career-goal-note">Working toward: <strong>{value.goal}</strong></p>}
      <p>{personal ? "Your path will use the focus skills you explicitly choose. A job title alone does not establish its skill requirements." : profile?.scope}</p>
      {coverage && <div className="career-coverage"><BookOpen size={16} /><span><strong>{coverage.covered} of {coverage.total}</strong> core areas have knowledge checks.{coverage.review > 0 && ` ${coverage.review} specialist areas need additional content or practical review.`}</span></div>}
      <div className="career-skill-tags">{profile?.requirements.map(item => {const skill = careerSkillForKey(item.skill)!; return <span key={item.skill} className={skill.topic ? "" : "needs-review"}>{skill.topic ? <BookOpen size={12} /> : <PenLine size={12} />}{skill.name}</span>;})}</div>
      {personal && value.focusIds.length === 0 && <p className="career-required-note">Choose at least one focus skill below before saving this goal.</p>}
      {profile && <details className="career-source"><summary>About this career profile</summary><p>VoidFill&apos;s curated foundation profile is related to <a href={profile.occupation.url} target="_blank" rel="noopener noreferrer">{profile.occupation.title}</a> in O*NET. Requirements vary by employer and country. Learning targets are curriculum goals.</p></details>}
    </div>}

    <details className="career-focus" open={personal || value.focusIds.length > 0 ? true : undefined}>
      <summary>{personal ? "Choose your focus skills" : "Add focus skills or work context"}<span>{value.focusIds.length}/{MAX_FOCUS_SKILLS} focus skills</span></summary>
      <label htmlFor={`${uid}-skill-search`}>Find a focus skill</label><input id={`${uid}-skill-search`} type="search" value={skillQuery} disabled={disabled} placeholder="Search skills, such as accounting or React" onChange={event => setSkillQuery(event.target.value)} />
      <div className="career-focus-options">{focusOptions.map(skill => {
        const metadata = careerSkillForName(skill.name)!;
        const included = baseline.has(skill.name);
        const checked = included || value.focusIds.includes(skill.id);
        return <label key={skill.id}><input type="checkbox" checked={checked} disabled={disabled || included || (!checked && value.focusIds.length >= MAX_FOCUS_SKILLS)} onChange={event => onChange({...value, focusIds: event.target.checked ? [...value.focusIds, skill.id] : value.focusIds.filter(id => id !== skill.id)})} /><span><strong>{skill.name}</strong><small>{included ? "Included in this path" : metadata.topic ? `${metadata.coverage.questions} knowledge questions · learning resources` : "Specialist practice · knowledge checks pending"}</small></span></label>;
      })}{!focusOptions.length && <p className="career-help">No matching catalogue skill. Try another name; new specialist content is added in reviewed releases.</p>}</div>
      <label htmlFor={`${uid}-context`}>Describe the work you want to do <span>(optional)</span></label><textarea id={`${uid}-context`} rows={3} maxLength={2000} disabled={disabled} value={value.context} placeholder="Describe a role or paste the relevant responsibilities from a job description…" onChange={event => onChange({...value, context: event.target.value})} />
      <div className="career-inline-actions"><button type="button" disabled={disabled || !value.context.trim()} onClick={() => {setQuery(value.context);setFamily("");setVisible(8);}}>Suggest profiles from this description</button></div><p className="career-help">This description is saved with your learning profile. Confirm the profile and focus skills that fit your goal.</p>
    </details>
  </section>;
}
