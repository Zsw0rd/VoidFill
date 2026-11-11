import { resourceSourceNotes } from "@/lib/resourceSourceNotes";

export function ResourceSourceNote({url}: {url: string | null | undefined}) {
  const notes = resourceSourceNotes(url);
  if (!notes.length) return null;
  return <div className="resource-source-notes">{notes.map((note, index) => <details key={`${note.section}-${index}`}>
    <summary>Source correction · {note.section}</summary><p>{note.detail}</p>
    <ul>{note.support_urls.map((link, i) => <li key={link}><a href={link} target="_blank" rel="noopener noreferrer">Correction reference {i + 1} · {new URL(link).hostname}<span className="sr-only"> (opens in a new tab)</span> ↗</a></li>)}</ul>
  </details>)}</div>;
}
