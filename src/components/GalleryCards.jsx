export default function GalleryCards() {
  return (
    <div className="gallery-stage">
      <div className="gallery">
        <div className="gcard dark">
          <div className="float-panel">
            <div className="mini-tabs"><span className="on">Method</span><span>Related Work</span><span>More</span></div>
            <div className="mini-body">Predicted review comments in the margin</div>
            <div className="mini-bar"></div>
            <div className="mini-bar short"></div>
            <span className="mini-btn">Apply</span>
          </div>
          <div className="gcard-label">See predicted reviews, paragraph by paragraph</div>
        </div>

        <div className="gcard violet">
          <div className="float-panel">
            <div className="tag"><span className="dot2"></span>Reviewer 2 · Clarity</div>
            <div className="headline">Comparison target is unclear</div>
            <div className="quote">Contrast in one sentence <mark>what's different</mark> from prior work.</div>
            <div className="actions"><span className="accept">Apply</span><span className="dismiss">Dismiss</span></div>
          </div>
        </div>

        <div className="gcard lime">
          <div className="float-panel">
            <div className="tag"><span className="badge">P</span>Suggested related-work addition</div>
            <div className="headline">Citations feel a bit thin</div>
            <div className="quote">Three similar papers got <mark>the same note</mark> before being revised.</div>
            <div className="actions"><span className="accept">View</span><span className="dismiss">Dismiss</span></div>
          </div>
          <div className="icon-dock"><span>⌕</span><span>✓</span><span>§</span></div>
        </div>

        <div className="gcard dark" style={{ opacity: 0.55 }}>
          <div className="gcard-label">See more examples →</div>
        </div>
      </div>
      <div className="gallery-nav">›</div>
    </div>
  );
}