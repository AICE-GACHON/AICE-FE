const FEATURES = [
  { icon: '⌕', title: 'Confidence-scored search', desc: 'Every result comes with a confidence signal — weak or off-topic matches get flagged instead of shown as certain.' },
  { icon: '≈', title: 'Rank + match reason, not a score', desc: 'We show why a paper matched — semantic, lexical, or both — instead of a similarity percentage that can’t really be compared.' },
  { icon: '🕓', title: 'Full review timeline per paper', desc: 'Reviews, rebuttals, comments, and revisions merged into one chronological story, in the order they actually happened.' },
  { icon: '★', title: 'Distinctive review patterns', desc: 'Patterns are ranked by how unusual they are for your topic against the corpus baseline, not by raw frequency.' },
  { icon: '🏛', title: 'Venue trends with bias warnings', desc: 'Acceptance rates are shown alongside corpus baselines, with sample-bias flags where a venue’s data is skewed.' },
  { icon: '✎', title: 'Real revision diffs', desc: 'See exactly what authors changed in the title, abstract, and attachments after review — word-level, not guessed.' },
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