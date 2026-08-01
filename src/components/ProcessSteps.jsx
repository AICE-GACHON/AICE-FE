export default function ProcessSteps() {
  return (
    <section id="process">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">How it works</div>
          <h2>Three steps to see the review before you submit</h2>
        </div>
        <div className="process">
          <div><div className="num">01</div><h4>Search similar papers</h4><p>Using embeddings that include text, figures, and equations, we find the prior papers closest to your draft.</p></div>
          <div><div className="num">02</div><h4>Check review & revision history</h4><p>See the actual review comments those papers received, side by side with how they were revised afterward.</p></div>
          <div><div className="num">03</div><h4>Predicted review & suggested edits</h4><p>Based on accumulated review patterns, we suggest likely comments and revision directions. The final call is always the author's.</p></div>
        </div>
      </div>
    </section>
  );
}