import { normalizePracticalLink } from "@/lib/practicalLinks";

/** Part of the saved brief: reviewers see the same synthetic inputs as learners. */
export function PracticalCaseInputs({inputs}: {inputs?: string[]}) {
  if (!inputs?.length) return null;
  return <section className="practical-case-pack" aria-label="Synthetic case inputs">
    <h3>Your case inputs</h3>
    <p>Use these fictional inputs. Record any extra assumptions you make.</p>
    <ul>{inputs.map((input, index) => <li key={index}>{input}</li>)}</ul>
  </section>;
}

export function PracticalCaseReferences({sources}: {sources?: {title: string; url: string}[]}) {
  const safeSources = (sources || []).map(source => ({title: source.title, url: normalizePracticalLink(source.url)})).filter((source): source is {title: string; url: string} => !!source.url);
  if (!safeSources.length) return null;
  return <details className="practical-case-references">
    <summary>Concept references ({safeSources.length})</summary>
    <p>Background for the concepts. These sources do not endorse or validate this exercise.</p>
    <ul>{safeSources.map((source, index) => <li key={index}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul>
  </details>;
}
