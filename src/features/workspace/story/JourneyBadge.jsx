const isAccept = (decision) => (decision || '').startsWith('accept');

const OUTCOME_HIGHLIGHT = {
  improved: '✓ 탈락 후 고쳐서 통과',
  still_rejected: '재투고했지만 또 탈락',
  mixed: '학회마다 결과가 갈림',
};

// stops가 1개(재투고 기록 없음)면 배지 자체를 숨긴다 — API 문서 §① 권장사항 그대로.
export default function JourneyBadge({ journey }) {
  if (!journey || journey.stops.length <= 1) return null;

  return (
    <div className={`story-journey story-journey-${journey.outcome}`}>
      <div className="story-journey-chain">
        {journey.stops.map((s, i) => (
          <span key={`${s.paper_id}-${i}`} className="story-journey-item">
            {i > 0 && <span className="story-journey-arrow">→</span>}
            <span className={`story-journey-stop${s.is_query ? ' is-query' : ''}`}>
              {s.venue} {s.year} · <span className={isAccept(s.decision) ? 'wr-decision accept' : 'wr-decision'}>{s.decision}</span>
            </span>
          </span>
        ))}
      </div>
      {OUTCOME_HIGHLIGHT[journey.outcome] && (
        <div className={`story-journey-outcome outcome-${journey.outcome}`}>{OUTCOME_HIGHLIGHT[journey.outcome]}</div>
      )}
      {journey.message && <p className="wr-muted" style={{ marginTop: 8 }}>{journey.message}</p>}
    </div>
  );
}
