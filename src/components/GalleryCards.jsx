export default function GalleryCards() {
  return (
    <div className="gallery-stage">
      <div className="gallery">
        <div className="gcard dark">
          <div className="float-panel">
            <div className="mini-tabs"><span className="on">Similar Papers</span><span>Reviews</span><span>Timeline</span></div>
            <div className="mini-body">Picked by reading your PDF, not by matching its abstract</div>
            <div className="mini-bar"></div>
            <div className="mini-bar short"></div>
            <span className="mini-btn">Open</span>
          </div>
          <div className="gcard-label">Every pick comes with the reason it was picked</div>
        </div>

        <div className="gcard violet">
          <div className="float-panel">
            <div className="tag"><span className="dot2"></span>ICLR 2024 → NeurIPS 2024</div>
            <div className="headline">Rejected, then revised and accepted</div>
            <div className="quote">Open the full timeline — <mark>what reviewers asked</mark>, what authors changed, what happened next.</div>
            <div className="actions"><span className="accept">Open story</span><span className="dismiss">Close</span></div>
          </div>
        </div>

        <div className="gcard lime">
          <div className="float-panel">
            <div className="tag"><span className="badge">❝</span>What a reviewer wrote</div>
            <div className="headline">“Evaluated only on QM9”</div>
            <div className="quote">From the actual review of a paper we picked — <mark>their words, not our summary</mark>.</div>
            <div className="actions"><span className="accept">Read the review</span><span className="dismiss">Dismiss</span></div>
          </div>
          <div className="icon-dock"><span>⌕</span><span>✓</span><span>§</span></div>
        </div>

        <div className="gcard dark" style={{ opacity: 0.55 }}>
          <div className="gcard-label">See the full analysis →</div>
        </div>
      </div>
      <div className="gallery-nav">›</div>
    </div>
  );
}
