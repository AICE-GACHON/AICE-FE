const FEATURES = [
  { icon: '⌕', title: 'Multimodal similarity search', desc: 'We embed text together with figures and tables to find papers that are truly similar in methodology.' },
  { icon: '✎', title: 'Review-to-revision linking', desc: 'We connect review comments to the final revision paragraph by paragraph, showing what changed and why.' },
  { icon: '✓', title: 'Conference & journal matching', desc: 'See which conferences and journals published similar papers, and how they tend to review.' },
  { icon: '§', title: 'Section-aware predictions', desc: 'Predicted comments are tailored to the section — Related Work, Method, Experiments, and more.' },
  { icon: '↻', title: 'Revision history', desc: 'Track a paper from v1 to v2 to the final version, and see what changed at every review round.' },
  { icon: '⌁', title: 'Code-change linking (experimental)', desc: 'For papers with public GitHub repos, we try to connect how the code changed after review.' },
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