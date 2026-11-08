/** Part of the saved brief: reviewers see the same synthetic inputs as learners. */
export function PracticalCaseInputs({inputs}: {inputs?: string[]}) {
  if (!inputs?.length) return null;
  return <section className="practical-case-pack" aria-label="Synthetic case inputs">
    <h3>Your case inputs</h3>
    <p>Use these fictional inputs. Record any extra assumptions you make.</p>
    <ul>{inputs.map((input, index) => <li key={index}>{input}</li>)}</ul>
  </section>;
}
