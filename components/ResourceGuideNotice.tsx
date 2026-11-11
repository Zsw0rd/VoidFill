import scopes from "../ml/data/lessons/resource-scopes.json";

export function ResourceGuideNotice({url}: {url: string | null | undefined}) {
  const guide = scopes.find(row => row.url === url?.trim());
  if (!guide) return null;
  return <div className="resource-guide-notice">
    <p>Use this guide for context and related reading. Only assessed lessons count toward lesson completion.</p>
    <details><summary>About this resource</summary><p>{guide.reason}</p></details>
    {guide.related_lessons.length > 0 && <div><p>Related teaching lessons</p><ul>{guide.related_lessons.map(lesson => <li key={lesson.id}><a href={lesson.url} target="_blank" rel="noopener noreferrer">{lesson.title}<span className="sr-only"> (opens in a new tab)</span> ↗</a></li>)}</ul></div>}
  </div>;
}
