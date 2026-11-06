"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { createPortal } from "react-dom";
import { BarChart3, Briefcase, Calculator, Cloud, Compass, Handshake, LifeBuoy, Megaphone, MessagesSquare, Network, Palette, ShieldCheck, Table2, Users, Wrench, BookOpen, Check, ChevronRight, Circle, ClipboardCheck, Code2, ExternalLink, GitBranch, Globe2, Layers3, LocateFixed, Maximize2, Minimize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { FocusDialog } from "@/components/FocusDialog";
import { careerSkillForName } from "@/lib/careerCatalog";
import { cn } from "@/components/ui/cn";
import { ATLAS_NODE_SIZE, ATLAS_RESOURCE_HEIGHT, ATLAS_RESOURCE_WIDTH, createAtlasLayout, fitAtlas, zoomAtlas } from "@/lib/atlasLayout";
import type { CourseAssessment, RoadmapCourse, SkillNode } from "./types";

type Camera = { x: number; y: number; scale: number };
type Props = {
  roleName: string;
  skills: SkillNode[];
  selectedSkillId: string | null;
  latestAssessmentByCourse: Map<string, CourseAssessment>;
  onSelectSkill: (id: string) => void;
  onOpenSkillAssessment: (name: string, id: string) => void;
  onOpenCourseAssessment: (course: RoadmapCourse, name: string, id: string) => void;
  onGenerateResources: () => void;
  generatingResources: boolean;
};

function skillIcon(name: string) {
  if (/git|version/i.test(name)) return GitBranch;
  if (/web|front/i.test(name)) return Globe2;
  if (/sql/i.test(name)) return Layers3;
  if (/cloud/i.test(name)) return Cloud;
  if (/security/i.test(name)) return ShieldCheck;
  if (/network/i.test(name)) return Network;
  if (/spreadsheet/i.test(name)) return Table2;
  const category = careerSkillForName(name)?.category;
  return ({Data: BarChart3, Finance: Calculator, People: Users, Sales: Handshake, Service: LifeBuoy, Marketing: Megaphone, Shared: MessagesSquare, Creative: Palette, Design: Palette, Engineering: Wrench, Business: Briefcase, Operations: Briefcase, Product: Compass, Tools: Wrench} as Record<string, typeof Code2>)[category || ""] || Code2;
}

function safeResourceUrl(url: string | null) {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

export function LearningAtlas({ roleName, skills, selectedSkillId, latestAssessmentByCourse, onSelectSkill, onOpenSkillAssessment, onOpenCourseAssessment, onGenerateResources, generatingResources }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(true);
  const [resourceId, setResourceId] = useState<string | null>(null);
  const [showResources, setShowResources] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const cameraRef = useRef(camera);
  const focusNextBranch = useRef(false);
  const dragRef = useRef<{ id: number; x: number; y: number; camera: Camera } | null>(null);
  const skill = skills.find(item => item.skill_id === selectedSkillId) || skills[0];
  const suggestedCourse = skill?.courses.find(course => !course.completed) || skill?.courses[0];
  const course = skill?.courses.find(item => item.id === resourceId) || suggestedCourse;
  const courseUrl = safeResourceUrl(course?.url || null);
  const layout = useMemo(() => createAtlasLayout(skills.map(item => ({ id: item.skill_id, resourceIds: expanded && item.skill_id === skill?.skill_id ? item.courses.map(course => course.id) : [] })), skill?.skill_id || null), [skills, skill?.skill_id, expanded]);

  const updateCamera = useCallback((next: Camera) => {
    cameraRef.current = next;
    setCamera(next);
  }, []);
  const restoreMapFocus = useCallback(() => {
    sectionRef.current?.querySelector<HTMLButtonElement>('[data-atlas-expand]')?.focus();
  }, []);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(node);
    return () => observer.disconnect();
  }, [fullscreen]);

  const fit = useCallback(() => {
    if (!size.width || !size.height) return;
    updateCamera(fitAtlas(layout.bounds, size.width, size.height));
  }, [layout.bounds, size, updateCamera]);

  useEffect(() => {
    if (!size.width || !size.height) return;
    if ((size.width < 650 || focusNextBranch.current) && layout.selected) {
      focusNextBranch.current = false;
      // A phone starts at a readable branch, with the overview one tap away.
      const scale = .72;
      updateCamera({ scale, x: size.width / 2 - layout.selected.x * scale, y: size.height * .40 - layout.selected.y * scale });
    } else {
      updateCamera(fitAtlas(layout.bounds, size.width, size.height));
    }
  }, [layout, size, updateCamera]);

  useEffect(() => {
    if (!fullscreen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    viewportRef.current?.focus();
    const escape = (event: globalThis.KeyboardEvent) => {
      if (sectionRef.current?.querySelector('[role="dialog"]')) return;
      if (event.key === "Escape") setFullscreen(false);
      if (event.key === "Tab") {
        const nodes = Array.from(sectionRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], select, [tabindex="0"]') || []).filter(node => node.getClientRects().length > 0);
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", escape);
      requestAnimationFrame(restoreMapFocus);
    };
  }, [fullscreen, restoreMapFocus]);

  const zoom = useCallback((factor: number, point = { x: size.width / 2, y: size.height / 2 }) => {
    const current = cameraRef.current;
    const nextScale = Math.min(1.8, Math.max(.2, current.scale * factor));
    updateCamera(zoomAtlas(current, nextScale, point));
  }, [size, updateCamera]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      zoom(Math.exp(-event.deltaY * .003), { x: event.clientX - rect.left, y: event.clientY - rect.top });
    };
    node.addEventListener("wheel", wheel, { passive: false });
    return () => node.removeEventListener("wheel", wheel);
  }, [zoom]);

  function chooseSkill(id: string) {
    if (id !== skill?.skill_id) focusNextBranch.current = true;
    onSelectSkill(id);
    setResourceId(null);
    setExpanded(true);
    if (id === skill?.skill_id && cameraRef.current.scale < .6) {
      const node = layout.nodes.find(item => item.id === id);
      if (node) updateCamera({ scale: .8, x: size.width / 2 - node.x * .8, y: size.height * .42 - node.y * .8 });
    }
  }

  function beginPan(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button, a, input, select")) return;
    event.currentTarget.focus({ preventScroll: true });
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, camera: cameraRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function movePan(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    updateCamera({ ...drag.camera, x: drag.camera.x + event.clientX - drag.x, y: drag.camera.y + event.clientY - drag.y });
  }

  function endPan(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    setDragging(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const directions: Record<string, [number, number]> = { ArrowLeft: [70, 0], ArrowRight: [-70, 0], ArrowUp: [0, 70], ArrowDown: [0, -70] };
    if (directions[event.key]) {
      event.preventDefault();
      const [dx, dy] = directions[event.key];
      updateCamera({ ...cameraRef.current, x: cameraRef.current.x + dx, y: cameraRef.current.y + dy });
    } else if (["+", "=", "-", "0", "Home"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "0" || event.key === "Home") fit();
      else zoom(event.key === "-" ? 1 / 1.2 : 1.2);
    }
  }

  function launchAssessment(target?: RoadmapCourse) {
    if (!skill) return;
    setFullscreen(false);
    setShowResources(false);
    if (target) onOpenCourseAssessment(target, skill.name, skill.skill_id);
    else onOpenSkillAssessment(skill.name, skill.skill_id);
  }

  function seePoint(x: number, y: number) {
    const current = cameraRef.current;
    const px = x * current.scale + current.x, py = y * current.scale + current.y;
    if (px < 100 || px > size.width - 100 || py < 70 || py > size.height - 80)
      updateCamera({ ...current, x: size.width / 2 - x * current.scale, y: size.height / 2 - y * current.scale });
  }

  if (!skill) return null;
  const bounds = layout.bounds;
  const mapWidth = bounds.right - bounds.left, mapHeight = bounds.bottom - bounds.top;
  const compact = camera.scale < .45;

  const content = (
    <section className={cn("learning-atlas", fullscreen && "atlas-fullscreen")} ref={sectionRef} aria-label="Your learning atlas">
      <div className="atlas-map-wrap">
        <div className="atlas-legend" aria-label="Map legend">
          <span><Check size={13} className="atlas-legend-check" /> Completed resource</span>
          <span><Circle size={13} className="atlas-legend-current" /> Recommended next</span>
          <span><Circle size={13} /> Not assessed</span>
        </div>
        <div className="atlas-mobile-branches">
          <label htmlFor="atlas-branch">Explore a skill</label>
          <select id="atlas-branch" value={skill.skill_id} onChange={event => chooseSkill(event.target.value)}>
            {skills.map(item => <option key={item.skill_id} value={item.skill_id}>{item.name}</option>)}
          </select>
        </div>

        <div ref={viewportRef} className={cn("atlas-viewport", dragging && "is-panning", compact && "is-overview")} tabIndex={0} role="region" aria-label="Interactive skill map. Arrow keys pan. Plus and minus zoom. Zero fits the map." onKeyDown={onKeyDown} onPointerDown={beginPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan}>
          <div className="atlas-world" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`, "--atlas-scale": camera.scale } as CSSProperties}>
            <svg className="atlas-connections" style={{ left: bounds.left, top: bounds.top }} width={mapWidth} height={mapHeight} viewBox={`${bounds.left} ${bounds.top} ${mapWidth} ${mapHeight}`} aria-hidden="true">
              <ellipse cx="0" cy="0" rx={layout.radius} ry={layout.radius * .78} className="atlas-orbit" />
              <ellipse cx="0" cy="0" rx={layout.radius + 34} ry={layout.radius * .78 + 34} className="atlas-orbit atlas-orbit-outer" />
              {layout.nodes.map(node => <path key={node.id} d={`M 0 0 C ${node.x * .3} ${node.y * .1}, ${node.x * .75} ${node.y * .86}, ${node.x} ${node.y}`} className={cn("atlas-connection", node.id === skill.skill_id && "is-selected")} />)}
              {layout.selected && layout.resources.map(node => <path key={node.id} d={`M ${layout.selected.x} ${layout.selected.y} C ${(layout.selected.x + node.x) / 2} ${layout.selected.y}, ${(layout.selected.x + node.x) / 2} ${node.y}, ${node.x} ${node.y}`} className="atlas-resource-connection" />)}
            </svg>

            <div className="atlas-goal" style={{ left: -85, top: -83 }}>
              <Compass size={29} strokeWidth={1.5} />
              <span className="atlas-goal-name">{roleName}</span>
              <span className="atlas-goal-label">Your goal</span>
            </div>

            {layout.nodes.map(node => {
              const item = skills.find(item => item.skill_id === node.id)!;
              const Icon = skillIcon(item.name);
              const active = item.skill_id === skill.skill_id;
              const ring = 2 * Math.PI * 99;
              return (
                <div className={cn("atlas-skill", active && "is-selected")} key={node.id} style={{ left: node.x - ATLAS_NODE_SIZE / 2, top: node.y - ATLAS_NODE_SIZE / 2 }}>
                  <button className="atlas-skill-disc" aria-label={`${item.name}. ${item.assessed ? `Skill score ${item.score}%` : "Not assessed"}. ${item.completedCourses} of ${item.totalCourses} resources completed.`} aria-pressed={active} onClick={() => chooseSkill(item.skill_id)} onFocus={() => seePoint(node.x, node.y)}>
                    <svg className="atlas-score-ring" viewBox="0 0 216 216" aria-hidden="true">
                      <circle cx="108" cy="108" r="104" className="atlas-ring-outline" />
                      <circle cx="108" cy="108" r="99" className="atlas-ring-track" />
                      {item.assessed && <circle cx="108" cy="108" r="99" className="atlas-ring-score" strokeDasharray={`${ring * item.skillProgress / 100} ${ring}`} transform="rotate(-90 108 108)" />}
                    </svg>
                    <Icon className="atlas-skill-icon" size={25} strokeWidth={1.5} />
                    <span className="atlas-skill-name">{item.name}</span>
                    <span className="atlas-score-label">{item.assessed ? `Score: ${item.skillProgress}%` : "Not assessed"}</span>
                    <span className="atlas-resource-count"><Layers3 size={17} /><span>Resources<strong>{item.completedCourses}/{item.totalCourses} complete</strong></span></span>
                  </button>
                  <button className="atlas-expand" aria-expanded={active && expanded} onClick={() => { if (active) setExpanded(value => !value); else chooseSkill(item.skill_id); }}>
                    {active && expanded ? "Collapse branch" : "Expand branch"}<ChevronRight size={15} className={active && expanded ? "rotate-90" : ""} />
                  </button>
                </div>
              );
            })}

            {layout.resources.map(node => {
              const resource = skill.courses.find(item => item.id === node.id)!;
              const recommended = suggestedCourse?.id === resource.id && !resource.completed;
              const current = course?.id === resource.id;
              return (
                <button key={node.id} className={cn("atlas-resource", resource.completed && "is-completed", recommended && "is-next", current && "is-current")} style={{ left: node.x - ATLAS_RESOURCE_WIDTH / 2, top: node.y - ATLAS_RESOURCE_HEIGHT / 2 }} aria-pressed={current} onClick={() => setResourceId(resource.id)} onFocus={() => seePoint(node.x, node.y)} title={resource.title}>
                  <span className="atlas-resource-icon">{resource.completed ? <Check size={20} /> : <BookOpen size={21} strokeWidth={1.6} />}</span>
                  <span className="atlas-resource-text"><strong>{resource.title}</strong><span>{resource.completed ? "Completed" : recommended ? "Recommended next" : latestAssessmentByCourse.has(resource.id) || visited.has(resource.id) ? "In progress" : "Available to explore"}</span></span>
                  <ChevronRight size={16} />
                </button>
              );
            })}
            {layout.more && <button className="atlas-more-resources" style={{left:layout.more.x - 103, top:layout.more.y}} onClick={() => setShowResources(true)}>View all {skill.totalCourses} resources<ChevronRight size={14} /></button>}
          </div>
        </div>

        <button className="atlas-minimap" onClick={fit} aria-label="Map overview: fit all skills" title="See the whole atlas">
          <svg viewBox={`${bounds.left - 40} ${bounds.top - 40} ${mapWidth + 80} ${mapHeight + 80}`} aria-hidden="true">
            {layout.nodes.map(node => <line key={node.id} x1="0" y1="0" x2={node.x} y2={node.y} stroke={node.id === skill.skill_id ? "#bd482c" : "#8a9c80"} strokeWidth="7" />)}
            {layout.nodes.map(node => <circle key={node.id} cx={node.x} cy={node.y} r="58" fill="#f6f5ed" stroke={node.id === skill.skill_id ? "#bd482c" : "#829376"} strokeWidth="8" />)}
            <circle cx="0" cy="0" r="30" fill="#ede6ce" stroke="#b4a47b" strokeWidth="6" />
            <rect x={-camera.x / camera.scale} y={-camera.y / camera.scale} width={size.width / camera.scale} height={size.height / camera.scale} rx="10" fill="none" stroke="#bd482c" strokeWidth="4" strokeDasharray="14 10" />
          </svg>
        </button>
        <div className="atlas-map-tools" aria-label="Map controls">
          <button onClick={fit} aria-label="Fit whole map" title="Fit map (0)"><LocateFixed size={17} /><span>Fit</span></button>
          <span className="atlas-tool-divider" />
          <button onClick={() => zoom(1 / 1.2)} disabled={camera.scale <= .2} aria-label="Zoom out" title="Zoom out (-)"><Minus size={18} /></button>
          <output aria-label="Map zoom">{Math.round(camera.scale * 100)}%</output>
          <button onClick={() => zoom(1.2)} disabled={camera.scale >= 1.8} aria-label="Zoom in" title="Zoom in (+)"><Plus size={18} /></button>
          <span className="atlas-tool-divider" />
          <button data-atlas-expand onClick={() => setFullscreen(value => !value)} aria-label={fullscreen ? "Exit expanded map" : "Expand map"} title={fullscreen ? "Exit expanded map (Esc)" : "Expand map"}>{fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
        </div>
        <span className="atlas-pan-hint">Drag to explore · Ctrl / ⌘ + scroll to zoom</span>
      </div>

      <div className="atlas-context-dock" aria-live="polite" aria-atomic="false">
        {skill.assessable === false && <a href="/careers" className="atlas-secondary-action">Open practical career activity ↗</a>}
        <div className="atlas-dock-skill"><Globe2 size={25} strokeWidth={1.4} /><div><strong>{skill.name}</strong><span>{skill.assessable === false ? "Specialist practice · review needed" : skill.assessed ? `Knowledge score ${skill.skillProgress}%` : "Knowledge not assessed"}</span></div></div>
        <div className="atlas-dock-resource">
          {course ? <><span className={cn("atlas-status-tag", course.completed && "is-completed")}>{course.completed ? "Completed resource" : suggestedCourse?.id === course.id ? "Recommended next" : "Selected resource"}</span><strong title={course.title}>{course.title}</strong><span>{course.provider || "Learning resource"}{course.estimated_hours ? ` · ~${course.estimated_hours} h` : ""}</span></> : <><strong>A new branch, ready to grow.</strong><span>{skill.assessable === false ? "Dedicated resources and knowledge checks are pending. Start with the practical career activity." : "Find learning resources for this skill, or start with a knowledge assessment."}</span></>}
        </div>
        <button className="atlas-dock-progress" onClick={() => setShowResources(true)} aria-label={`View all ${skill.totalCourses} resources for ${skill.name}`}><Layers3 size={18} /><span><strong>{skill.completedCourses} of {skill.totalCourses}</strong> resources completed</span><ChevronRight size={16} /></button>
        <div className="atlas-dock-actions">
          <button className="atlas-secondary-action" disabled={skill.assessable === false} onClick={() => void launchAssessment()}><ClipboardCheck size={17} /><span>{skill.assessable === false ? "Knowledge check pending" : "Take knowledge assessment"}</span></button>
          {courseUrl ? <a className="atlas-primary-action" href={courseUrl} target="_blank" rel="noopener noreferrer" onClick={() => setVisited(ids => new Set(ids).add(course!.id))}>Open resource<ExternalLink size={16} /></a> : <button className="atlas-primary-action" disabled={generatingResources || !!course || skill.assessable === false} onClick={onGenerateResources}>{generatingResources ? "Finding resources…" : course ? "No resource link" : skill.assessable === false ? "Resources pending" : "Find resources"}<ChevronRight size={16} /></button>}
        </div>
      </div>

      {showResources && <div className="atlas-resource-overlay" onClick={event => { if (event.target === event.currentTarget) setShowResources(false); }}>
        <div className="atlas-resource-sheet">
          <FocusDialog label={`Resources for ${skill.name}`} onClose={() => setShowResources(false)}>
            <div className="atlas-sheet-heading"><div><p className="eyebrow">Your selected branch</p><h2>{skill.name}</h2></div><button onClick={() => setShowResources(false)} aria-label="Close resources"><X size={21} /></button></div>
            <p className="atlas-sheet-intro">{skill.completedCourses} of {skill.totalCourses} resources completed. Pass a resource assessment at 65% to complete it. Your measured skill score comes from assessments.</p>
            {!skill.courses.length && <div className="atlas-sheet-empty"><BookOpen size={30} /><p>{skill.assessable === false ? "Dedicated resources for this specialist area are pending. Use the practical activity in Career explorer." : "No resources on this branch yet."}</p>{skill.assessable === false && <a href="/careers" className="atlas-secondary-action">Open practical activity ↗</a>}<button className="atlas-primary-action" onClick={onGenerateResources} disabled={generatingResources || skill.assessable === false}>{generatingResources ? "Finding resources…" : "Find learning resources"}</button></div>}
            {skill.courses.map(resource => {
              const url = safeResourceUrl(resource.url);
              const previous = latestAssessmentByCourse.get(resource.id);
              return <article key={resource.id} className="atlas-sheet-resource">
                <div className="atlas-sheet-resource-title">{resource.completed ? <Check size={19} /> : <BookOpen size={19} />}<h3>{resource.title}</h3>{resource.completed && <span className="atlas-status-tag is-completed">Completed</span>}</div>
                <p className="atlas-sheet-provider">{resource.provider || "Learning resource"}{resource.estimated_hours ? ` · ~${resource.estimated_hours} hours` : ""}{resource.difficulty ? ` · ${resource.difficulty}` : ""}</p>
                {resource.description && <p>{resource.description}</p>}
                {previous && <p className="atlas-sheet-previous">Last assessment: {Math.round(previous.score)}%{previous.passed ? " · passed" : " · keep practicing"}</p>}
                <div className="atlas-sheet-resource-actions">{url && <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => setVisited(ids => new Set(ids).add(resource.id))}>Open resource<ExternalLink size={15} /></a>}<button onClick={() => void launchAssessment(resource)}>{previous ? <RotateCcw size={16} /> : <ClipboardCheck size={16} />}{previous ? "Retake assessment" : "Check understanding"}</button></div>
              </article>;
            })}
          </FocusDialog>
        </div>
      </div>}
    </section>
  );
  return fullscreen ? createPortal(content, document.body) : content;
}
