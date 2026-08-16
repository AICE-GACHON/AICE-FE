const FEATURES = [
  { icon: '📄', title: 'Your whole paper, not its abstract', desc: 'Search finds fifty candidates from the title and abstract. Then we hand the full PDF and those candidates to a model that reads both and picks the ones that actually match.' },
  { icon: '≈', title: 'A reason, not a score', desc: 'Each pick comes with one sentence on what the two papers share. We don’t show a similarity percentage, because between the top candidates the numbers differ by less than noise.' },
  { icon: '∅', title: 'Fewer results when fewer fit', desc: 'If only three papers genuinely match, you get three. If none do, we say so. Padding the list would make “what reviewers said about similar papers” a false claim.' },
  { icon: '❝', title: 'The reviews themselves', desc: 'Every review each paper received, in full — scores, criticisms, questions — plus the area chair’s summary. Not our paraphrase of them.' },
  { icon: '⚖', title: 'How it ended, not just what was said', desc: 'Every similar paper carries its outcome — accepted, rejected, or a split decision — and flags where reviewers disagreed. You see what happened to work like yours, not only the commentary on it.' },
  { icon: '∑', title: 'One summary across every review', desc: 'Past the individual reviews, a single synthesis of what reviewers kept asking for — each point traced back to the exact review it came from, so none of it is our invention.' },
  { icon: '⌕', title: 'Flagged when we’re out of depth', desc: 'The corpus is ICLR and NeurIPS. Upload something outside it and you get a warning, not five confident-looking matches.' },
  { icon: '🕓', title: 'The full review timeline', desc: 'Open any paper into reviews, author rebuttals, comments, and revisions merged in the order they actually happened — with word-level diffs of what changed.' },
];

export default function Features() {
  return (
    <section id="features">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Under the hood</div>
          <h2>Instead of giving you an answer, we hand you what you need to decide</h2>
          <p>Like a lawyer getting relevant statutes, or an accountant getting relevant deductions — you make the final call, and we prepare the information behind it.</p>
        </div>
        <div className="features">
          {FEATURES.map((f) => (
            <div className="feature" key={f.title}>
              <div className="icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}