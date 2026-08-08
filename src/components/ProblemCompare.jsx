export default function ProblemCompare() {
  return (
    <section id="problem">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Why not just search similar papers</div>
          <h2>Finding similar papers already exists.<br />What's missing is everything after that.</h2>
          <p>Existing similar-paper search matches titles and abstracts by embedding, and stops there. What you actually need comes next.</p>
        </div>
        <div className="compare">
          <div className="old">
            <h4>Existing similar-paper search</h4>
            <ul>
              <li>Matches on the title and abstract only — never opens the paper</li>
              <li>Returns twenty near-identical scores and calls it a ranking</li>
              <li>Lists related work, then leaves you there</li>
              <li>No way to see what reviewers said about any of it</li>
            </ul>
          </div>
          <div className="new">
            <h4>PAIR</h4>
            <ul>
              <li>Reads your full PDF — method, experiments, reference list — to pick what's genuinely close</li>
              <li>Tells you in a sentence why each paper was picked, and picks fewer when fewer match</li>
              <li>Hands you the reviews those papers received, in full, with the reviewers' own words</li>
              <li>Opens any of them into the whole story — rebuttals, revisions, what happened next</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}