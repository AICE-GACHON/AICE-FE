export default function ProblemCompare() {
  return (
    <section id="problem">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Why not just search similar papers</div>
          <h2>Finding similar papers already exists.<br />What's missing is everything after that.</h2>
          <p>Existing similar-paper search tools stop at listing related work by embedding. What you actually need comes next.</p>
        </div>
        <div className="compare">
          <div className="old">
            <h4>Existing similar-paper search</h4>
            <ul>
              <li>Just lists papers with similar topics or citations</li>
              <li>No way to know what reviews they received</li>
              <li>What changed after review is a separate question</li>
              <li>You have to guess what reviews your own paper will get</li>
            </ul>
          </div>
          <div className="new">
            <h4>PaperTrace</h4>
            <ul>
              <li>Similar papers plus the actual reviews they received</li>
              <li>Connects review comments all the way to the final revision</li>
              <li>Generates predicted review comments for your draft, paragraph by paragraph</li>
              <li>Also shows which conferences or journals similar papers were published in</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}